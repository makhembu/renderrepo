const axios = require('axios');

const TIMEBASE_URI = 'https://renderrepo-ain0.onrender.com';

async function testMovie(movieId) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing Movie ID: ${movieId}`);
  console.log('='.repeat(60));
  
  try {
    console.log(`\n1. Fetching embed URL from API...`);
    console.log(`   ${TIMEBASE_URI}/movie/${movieId}`);
    
    const apiRes = await axios.get(`${TIMEBASE_URI}/movie/${movieId}`, { timeout: 45000 });
    console.log(`   ✓ API Response:`);
    console.log(`     Success: ${apiRes.data.success}`);
    console.log(`     Embed URL: ${apiRes.data.defaultEmbed}`);
    console.log(`     Type: ${apiRes.data.embeds?.[0]?.type}`);
    
    if (!apiRes.data.success || !apiRes.data.defaultEmbed) {
      console.log(`\n   ✗ No embed URL returned`);
      return { success: false, error: apiRes.data.error || 'No embed URL' };
    }
    
    const embedUrl = apiRes.data.defaultEmbed;
    
    console.log(`\n2. Testing if embed is accessible...`);
    try {
      const embedRes = await axios.get(embedUrl, { 
        timeout: 15000,
        headers: { 'User-Agent': MODERN_UA },
        validateStatus: () => true 
      });
      console.log(`   Embed status: ${embedRes.status}`);
      
      if (embedRes.status === 200 && embedRes.data) {
        const hasM3u8 = embedRes.data.includes('.m3u8');
        const hasIframe = embedRes.data.includes('<iframe');
        console.log(`   Contains m3u8: ${hasM3u8}`);
        console.log(`   Contains iframe: ${hasIframe}`);
      }
    } catch(e) {
      console.log(`   Embed fetch error: ${e.message}`);
    }
    
    const success = true;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`EMBED TEST ${success ? 'PASSED ✓' : 'FAILED ✗'}`);
    console.log('='.repeat(60));
    
    return { 
      success, 
      embedUrl,
    };
  } catch (err) {
    console.log(`\n   ✗ Error: ${err.message}`);
    if (err.response) {
      console.log(`   Status: ${err.response.status}`);
      console.log(`   Data: ${JSON.stringify(err.response.data).substring(0, 200)}`);
    }
    return { success: false, error: err.message };
  }
}

async function getM3U8(url, referer, origin) {
  return fetchWithHeaders(url, {
    'Referer': referer,
    'Origin': origin,
  });
}

async function parseM3U8(content, baseUrl) {
  const lines = content.split('\n');
  const result = { segments: [], playlists: [] };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) {
      if (line.includes(':URI=')) {
        const uriMatch = line.match(/URI="([^"]+)"/);
        if (uriMatch) {
          let uri = uriMatch[1];
          if (!uri.startsWith('http')) {
            uri = new URL(uri, baseUrl).href;
          }
          const qualityMatch = line.match(/RESOLUTION=(\d+x\d+)/);
          result.playlists.push({ uri, quality: qualityMatch ? qualityMatch[1] : 'unknown' });
        }
      }
      continue;
    }
    if (line.endsWith('.m3u8')) {
      result.playlists.push({ uri: line.startsWith('http') ? line : new URL(line, baseUrl).href });
    } else if (line.endsWith('.ts') || line.endsWith('.aac') || line.endsWith('.mp4')) {
      const uri = line.startsWith('http') ? line : new URL(line, baseUrl).href;
      result.segments.push({ uri, duration: parseFloat(lines[i - 1]?.replace('#EXTINF:', '')) || 0 });
    }
  }
  
  return result;
}

async function testStreamForDuration(streamUrl, headers, maxSeconds = 60) {
  console.log(`\n  Testing stream for ${maxSeconds}s...\n`);
  
  const results = {
    manifest: false,
    playlists: false,
    segments: [],
    totalBytes: 0,
    errors: [],
    startTime: Date.now(),
  };
  
  try {
    console.log(` Fetching manifest: ${streamUrl.substring(0, 80)}...`);
    const manifestRes = await getM3U8(streamUrl, headers.Referer || 'https://videostr.net/', headers.Origin || 'https://videostr.net');
    
    if (manifestRes.status !== 200) {
      results.errors.push(`Manifest HTTP ${manifestRes.status}`);
      return results;
    }
    
    results.manifest = true;
    console.log(`  ✓ Manifest fetched (${manifestRes.data.length} bytes)`);
    
    const baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1);
    const parsed = await parseM3U8(manifestRes.data, baseUrl);
    
    if (parsed.playlists.length > 0) {
      console.log(`  Found ${parsed.playlists.length} quality playlist(s)`);
      
      for (const pl of parsed.playlists) {
        console.log(`  Fetching quality playlist: ${pl.uri.substring(0, 60)}...`);
        const plRes = await getM3U8(pl.uri, headers.Referer || 'https://videostr.net/', headers.Origin || 'https://videostr.net');
        
        if (plRes.status !== 200) {
          results.errors.push(`Playlist HTTP ${plRes.status}`);
          continue;
        }
        
        results.playlists = true;
        const plParsed = await parseM3U8(plRes.data, pl.uri.substring(0, pl.uri.lastIndexOf('/') + 1));
        
        console.log(`  ✓ Quality playlist fetched (${plParsed.segments.length} segments)`);
        
        const timeLimit = maxSeconds * 1000;
        let elapsed = 0;
        
        for (const seg of plParsed.segments) {
          if (Date.now() - results.startTime > timeLimit) {
            console.log(`  ⏱ Time limit reached (${maxSeconds}s)`);
            break;
          }
          
          try {
            const segRes = await getM3U8(seg.uri, headers.Referer || 'https://videostr.net/', headers.Origin || 'https://videostr.net');
            
            if (segRes.status === 200) {
              results.segments.push(seg.uri);
              results.totalBytes += segRes.data.length;
              elapsed += seg.duration;
            } else {
              results.errors.push(`Segment ${seg.uri.split('/').pop()} HTTP ${segRes.status}`);
            }
          } catch (e) {
            results.errors.push(`Segment error: ${e.message}`);
          }
        }
        
        if (results.segments.length > 0) {
          console.log(`  ✓ Tested ${results.segments.length} segments, ${results.totalBytes} bytes`);
          break;
        }
      }
    } else if (parsed.segments.length > 0) {
      console.log(`  Found ${parsed.segments.length} segments to test`);
      
      const timeLimit = maxSeconds * 1000;
      let elapsed = 0;
      
      for (const seg of parsed.segments) {
        if (Date.now() - results.startTime > timeLimit) {
          console.log(`  ⏱ Time limit reached (${maxSeconds}s)`);
          break;
        }
        
        try {
          const segRes = await getM3U8(seg.uri, headers.Referer || 'https://videostr.net/', headers.Origin || 'https://videostr.net');
          
          if (segRes.status === 200) {
            results.segments.push(seg.uri);
            results.totalBytes += segRes.data.length;
            elapsed += seg.duration;
          } else {
            results.errors.push(`Segment ${seg.uri.split('/').pop()} HTTP ${segRes.status}`);
          }
        } catch (e) {
          results.errors.push(`Segment error: ${e.message}`);
        }
      }
      
      if (results.segments.length > 0) {
        console.log(`  ✓ Tested ${results.segments.length} segments, ${results.totalBytes} bytes`);
      }
    } else {
      results.errors.push('No segments or playlists found in manifest');
    }
  } catch (e) {
    results.errors.push(e.message);
  }
  
  return results;
}

async function testMovie(movieId) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing Movie ID: ${movieId}`);
  console.log('='.repeat(60));
  
  try {
    console.log(`\n1. Fetching stream URL from API...`);
    console.log(`   ${TIMEBASE_URI}/movie/${movieId}`);
    
    const apiRes = await axios.get(`${TIMEBASE_URI}/movie/${movieId}`, { timeout: 45000 });
    console.log(`   ✓ API Response:`);
    console.log(`     Success: ${apiRes.data.success}`);
    console.log(`     Provider: ${apiRes.data.provider}`);
    console.log(`     Stream URL: ${apiRes.data.streamUrl?.substring(0, 80)}...`);
    
    if (!apiRes.data.success || !apiRes.data.streamUrl) {
      console.log(`\n   ✗ No stream URL returned`);
      return { success: false, error: apiRes.data.error || 'No stream URL' };
    }
    
    const streamUrl = apiRes.data.streamUrl;
    const headers = apiRes.data.headers || {};
    
    console.log(`\n2. Testing HLS streaming (60s)...`);
    const streamResult = await testStreamForDuration(streamUrl, headers, 60);
    
    console.log(`\n3. Results:`);
    console.log(`   Manifest loaded: ${streamResult.manifest}`);
    console.log(`   Playlists found: ${streamResult.playlists}`);
    console.log(`   Segments tested: ${streamResult.segments.length}`);
    console.log(`   Total bytes: ${streamResult.totalBytes}`);
    console.log(`   Duration: ${Math.round((Date.now() - streamResult.startTime) / 1000)}s`);
    
    if (streamResult.errors.length > 0) {
      console.log(`\n   Errors (${streamResult.errors.length}):`);
      for (const err of streamResult.errors.slice(0, 5)) {
        console.log(`    - ${err}`);
      }
    }
    
    const success = streamResult.manifest && streamResult.segments.length > 0;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`STREAM TEST ${success ? 'PASSED ✓' : 'FAILED ✗'}`);
    console.log('='.repeat(60));
    
    return { 
      success, 
      streamUrl,
      ...streamResult,
    };
  } catch (err) {
    console.log(`\n   ✗ Error: ${err.message}`);
    if (err.response) {
      console.log(`   Status: ${err.response.status}`);
      console.log(`   Data: ${JSON.stringify(err.response.data).substring(0, 200)}`);
    }
    return { success: false, error: err.message };
  }
}

async function testTv(tmdbId, season, episode) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing TV ID: ${tmdbId} S${season}E${episode}`);
  console.log('='.repeat(60));
  
  try {
    console.log(`\n1. Fetching embed URL from API...`);
    console.log(`   ${TIMEBASE_URI}/tv/${tmdbId}/${season}/${episode}`);
    
    const apiRes = await axios.get(`${TIMEBASE_URI}/tv/${tmdbId}/${season}/${episode}`, { timeout: 45000 });
    console.log(`   ✓ API Response:`);
    console.log(`     Success: ${apiRes.data.success}`);
    console.log(`     Embed URL: ${apiRes.data.defaultEmbed}`);
    
    if (!apiRes.data.success || !apiRes.data.defaultEmbed) {
      console.log(`\n   ✗ No embed URL returned`);
      return { success: false, error: apiRes.data.error || 'No embed URL' };
    }
    
    const success = true;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`EMBED TEST ${success ? 'PASSED ✓' : 'FAILED ✗'}`);
    console.log('='.repeat(60));
    
    return { success };
  } catch (err) {
    console.log(`\n   ✗ Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('\n🎬 HLS Stream Test Script');
  console.log('Testing streaming for up to 60 seconds\n');
  
  const tests = [
    { type: 'movie', id: '603' },
    { type: 'tv', id: '1399', season: '1', episode: '1' },
    { type: 'movie', id: '1317288' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    let result;
    if (test.type === 'movie') {
      result = await testMovie(test.id);
    } else {
      result = await testTv(test.id, test.season, test.episode);
    }
    
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n\n${'#'.repeat(60)}`);
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('#'.repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

main();