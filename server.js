const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const MODERN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// ============ VIDLINK (Go WASM) ============
function extractVidlink(tmdbId, season = null, episode = null) {
  return new Promise((resolve, reject) => {
    const args = [path.join(__dirname, 'vidlink_extractor.js'), String(tmdbId)];
    if (season) args.push(season, episode);
    
    const proc = spawn('node', args, { cwd: __dirname, timeout: 20000 });
    
    let output = '';
    let error = '';
    
    proc.stdout.on('data', (data) => { output += data; });
    proc.stderr.on('data', (data) => { error += data; });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(error || 'Process exited with code ' + code));
        return;
      }
      
      const streamMatch = output.match(/Stream URL: (https?:\/\/[^\n]+)/);
      if (streamMatch) {
        resolve({ streamUrl: streamMatch[1], raw: output });
      } else {
        resolve({ raw: output, error: 'No stream URL found' });
      }
    });
    
    proc.on('error', reject);
    
    setTimeout(() => {
      proc.kill();
      reject(new Error('Vidlink extraction timeout'));
    }, 20000);
  });
}

// ============ BACKUP PROVIDERS ============

async function get4khdhubStreams(tmdbId, type, season, episode) {
  try {
    const url = type === 'tv' 
      ? `https://4khdhub.com/tv/${tmdbId}/${season}/${episode}`
      : `https://4khdhub.com/movie/${tmdbId}`;
    
    const resp = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': MODERN_UA },
      validateStatus: () => true,
    });
    
    const html = resp.data;
    const streams = [];
    
    const m3u8Matches = [...html.matchAll(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g)];
    for (const match of m3u8Matches) {
      streams.push({
        url: match[1],
        quality: '1080',
        type: 'hls',
        provider: '4khdhub',
        headers: {
          'Referer': 'https://4khdhub.com/',
          'Origin': 'https://4khdhub.com',
        }
      });
    }
    
    return streams;
  } catch {
    return [];
  }
}

async function getMoviesModStreams(tmdbId, type, season, episode) {
  try {
    const url = type === 'tv'
      ? `https://moviesmod.rip/tv/${tmdbId}/${season}/${episode}`
      : `https://moviesmod.rip/movie/${tmdbId}`;
    
    const resp = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': MODERN_UA },
      validateStatus: () => true,
    });
    
    const html = resp.data;
    const streams = [];
    
    const m3u8Matches = [...html.matchAll(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g)];
    for (const match of m3u8Matches) {
      streams.push({
        url: match[1],
        quality: '1080',
        type: 'hls',
        provider: 'moviesmod',
        headers: {
          'Referer': 'https://moviesmod.rip/',
          'Origin': 'https://moviesmod.rip',
        }
      });
    }
    
    return streams;
  } catch {
    return [];
  }
}

async function getMP4HydraStreams(tmdbId, type, season, episode) {
  try {
    const url = type === 'tv'
      ? `https://mp4hydra.org/tv/${tmdbId}/${season}/${episode}`
      : `https://mp4hydra.org/movie/${tmdbId}`;
    
    const resp = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': MODERN_UA },
      validateStatus: () => true,
    });
    
    const html = resp.data;
    const streams = [];
    
    const m3u8Matches = [...html.matchAll(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g)];
    for (const match of m3u8Matches) {
      streams.push({
        url: match[1],
        quality: '1080',
        type: 'hls',
        provider: 'mp4hydra',
        headers: {
          'Referer': 'https://mp4hydra.org/',
          'Origin': 'https://mp4hydra.org',
        }
      });
    }
    
    return streams;
  } catch {
    return [];
  }
}

async function getVidZeeStreams(tmdbId, type, season, episode) {
  try {
    const url = type === 'tv'
      ? `https://vidzee.com/tv/${tmdbId}/${season}/${episode}`
      : `https://vidzee.com/movie/${tmdbId}`;
    
    const resp = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': MODERN_UA },
      validateStatus: () => true,
    });
    
    const html = resp.data;
    const streams = [];
    
    const m3u8Matches = [...html.matchAll(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g)];
    for (const match of m3u8Matches) {
      streams.push({
        url: match[1],
        quality: '1080',
        type: 'hls',
        provider: 'vidzee',
        headers: {
          'Referer': 'https://vidzee.com/',
          'Origin': 'https://vidzee.com',
        }
      });
    }
    
    return streams;
  } catch {
    return [];
  }
}

async function getVixsrcStreams(tmdbId, type, season, episode) {
  try {
    const url = type === 'tv'
      ? `https://vixsrc.net/tv/${tmdbId}/${season}/${episode}`
      : `https://vixsrc.net/movie/${tmdbId}`;
    
    const resp = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': MODERN_UA },
      validateStatus: () => true,
    });
    
    const html = resp.data;
    const streams = [];
    
    const m3u8Matches = [...html.matchAll(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g)];
    for (const match of m3u8Matches) {
      streams.push({
        url: match[1],
        quality: '1080',
        type: 'hls',
        provider: 'vixsrc',
        headers: {
          'Referer': 'https://vixsrc.net/',
          'Origin': 'https://vixsrc.net',
        }
      });
    }
    
    return streams;
  } catch {
    return [];
  }
}

async function getUHDMoviesStreams(tmdbId, type, season, episode) {
  try {
    const url = type === 'tv'
      ? `https://uhdmovies.rip/tv/${tmdbId}/${season}/${episode}`
      : `https://uhdmovies.rip/movie/${tmdbId}`;
    
    const resp = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': MODERN_UA },
      validateStatus: () => true,
    });
    
    const html = resp.data;
    const streams = [];
    
    const m3u8Matches = [...html.matchAll(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g)];
    for (const match of m3u8Matches) {
      streams.push({
        url: match[1],
        quality: '1080',
        type: 'hls',
        provider: 'uhdmovies',
        headers: {
          'Referer': 'https://uhdmovies.rip/',
          'Origin': 'https://uhdmovies.rip',
        }
      });
    }
    
    return streams;
  } catch {
    return [];
  }
}

async function getShowboxStreams(tmdbId, type, season, episode) {
  try {
    const url = type === 'tv'
      ? `https://showbox.54420.xyz/tv/${tmdbId}/${season}/${episode}`
      : `https://showbox.54420.xyz/movie/${tmdbId}`;
    
    const resp = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': MODERN_UA },
      validateStatus: () => true,
    });
    
    const html = resp.data;
    const streams = [];
    
    const m3u8Matches = [...html.matchAll(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g)];
    for (const match of m3u8Matches) {
      streams.push({
        url: match[1],
        quality: '1080',
        type: 'hls',
        provider: 'showbox',
        headers: {
          'Referer': 'https://showbox.54420.xyz/',
          'Origin': 'https://showbox.54420.xyz',
        }
      });
    }
    
    return streams;
  } catch {
    return [];
  }
}

async function getZoeChipStreams(tmdbId, type, season, episode) {
  try {
    const url = type === 'tv'
      ? `https://zoechip.cc/tv/${tmdbId}/${season}/${episode}`
      : `https://zoechip.cc/movie/${tmdbId}`;
    
    const resp = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': MODERN_UA },
      validateStatus: () => true,
    });
    
    const html = resp.data;
    const streams = [];
    
    const m3u8Matches = [...html.matchAll(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g)];
    for (const match of m3u8Matches) {
      streams.push({
        url: match[1],
        quality: '1080',
        type: 'hls',
        provider: 'zoechip',
        headers: {
          'Referer': 'https://zoechip.cc/',
          'Origin': 'https://zoechip.cc',
        }
      });
    }
    
    return streams;
  } catch {
    return [];
  }
}

async function getSmashyStream(tmdbId, type, season, episode) {
  try {
    const url = type === 'tv'
      ? `https://smashystream.xyz/tv/${tmdbId}/${season}/${episode}`
      : `https://smashystream.xyz/movie/${tmdbId}`;
    
    const resp = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': MODERN_UA },
      validateStatus: () => true,
    });
    
    const html = resp.data;
    const streams = [];
    
    const m3u8Matches = [...html.matchAll(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g)];
    for (const match of m3u8Matches) {
      streams.push({
        url: match[1],
        quality: '1080',
        type: 'hls',
        provider: 'smashystream',
        headers: {
          'Referer': 'https://smashystream.xyz/',
          'Origin': 'https://smashystream.xyz',
        }
      });
    }
    
    return streams;
  } catch {
    return [];
  }
}

async function getFlixHQStreams(tmdbId, type, season, episode) {
  try {
    const url = type === 'tv'
      ? `https://flixhq.to/tv/${tmdbId}/${season}/${episode}`
      : `https://flixhq.to/movie/${tmdbId}`;
    
    const resp = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': MODERN_UA },
      validateStatus: () => true,
    });
    
    const html = resp.data;
    const streams = [];
    
    const m3u8Matches = [...html.matchAll(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g)];
    for (const match of m3u8Matches) {
      streams.push({
        url: match[1],
        quality: '1080',
        type: 'hls',
        provider: 'flixhq',
        headers: {
          'Referer': 'https://flixhq.to/',
          'Origin': 'https://flixhq.to',
        }
      });
    }
    
    return streams;
  } catch {
    return [];
  }
}

async function getGomoviesStreams(tmdbId, type, season, episode) {
  try {
    const url = type === 'tv'
      ? `https://gomovies.sx/tv/${tmdbId}/${season}/${episode}`
      : `https://gomovies.sx/movie/${tmdbId}`;
    
    const resp = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': MODERN_UA },
      validateStatus: () => true,
    });
    
    const html = resp.data;
    const streams = [];
    
    const m3u8Matches = [...html.matchAll(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g)];
    for (const match of m3u8Matches) {
      streams.push({
        url: match[1],
        quality: '1080',
        type: 'hls',
        provider: 'gomovies',
        headers: {
          'Referer': 'https://gomovies.sx/',
          'Origin': 'https://gomovies.sx',
        }
      });
    }
    
    return streams;
  } catch {
    return [];
  }
}

const backupProviders = [
  { id: '4khdhub', name: '4KHDHub', fn: get4khdhubStreams },
  { id: 'moviesmod', name: 'MoviesMod', fn: getMoviesModStreams },
  { id: 'mp4hydra', name: 'MP4Hydra', fn: getMP4HydraStreams },
  { id: 'vidzee', name: 'VidZee', fn: getVidZeeStreams },
  { id: 'vixsrc', name: 'VixSrc', fn: getVixsrcStreams },
  { id: 'uhdmovies', name: 'UHDMovies', fn: getUHDMoviesStreams },
  { id: 'showbox', name: 'ShowBox', fn: getShowboxStreams },
  { id: 'zoechip', name: 'ZoeChip', fn: getZoeChipStreams },
  { id: 'smashystream', name: 'SmashyStream', fn: getSmashyStream },
  { id: 'flixhq', name: 'FlixHQ', fn: getFlixHQStreams },
  { id: 'gomovies', name: 'GoMovies', fn: getGomoviesStreams },
];

async function getAllBackupStreams(tmdbId, type, season, episode) {
  const allStreams = [];
  
  for (const provider of backupProviders) {
    try {
      const streams = await provider.fn(tmdbId, type, season, episode);
      if (streams.length > 0) {
        console.log(`[Backup] ${provider.name} found ${streams.length} streams`);
        allStreams.push(...streams);
      }
    } catch (err) {
      console.log(`[Backup] ${provider.name} failed:`, err.message);
    }
  }
  
  return allStreams;
}

// ============ API ENDPOINTS ============

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    source: 'vidlink.pro (Go WASM) + 11 backup providers',
    providers: backupProviders.map(p => p.id),
    uptime: process.uptime(),
  });
});

app.get('/movie/:tmdbId', async (req, res) => {
  const { tmdbId } = req.params;
  
  try {
    console.log(`[Movie ${tmdbId}] Trying vidlink.pro...`);
    const vidlinkResult = await extractVidlink(tmdbId);
    
    if (vidlinkResult.streamUrl) {
      if (vidlinkResult.streamUrl.includes('storm.vodvidl.site')) {
        console.log(`[Movie ${tmdbId}] Testing storm.vodvidl.site...`);
        const testUrl = vidlinkResult.streamUrl;
        try {
          const testRes = await axios.get(testUrl, {
            timeout: 10000,
            headers: {
              'User-Agent': MODERN_UA,
              'Referer': 'https://videostr.net/',
              'Origin': 'https://videostr.net',
            },
            validateStatus: () => true,
          });
          if (testRes.status !== 200 || !testRes.data.includes('#EXT')) {
            console.log(`[Movie ${tmdbId}] storm.vodvidl.site returned ${testRes.status}, trying backups...`);
          } else {
            console.log(`[Movie ${tmdbId}] Vidlink SUCCESS`);
            return res.json({
              success: true,
              type: 'movie',
              tmdbId,
              streamUrl: vidlinkResult.streamUrl,
              provider: 'vidlink',
              referer: 'https://videostr.net/',
              headers: {
                'Referer': 'https://videostr.net/',
                'Origin': 'https://videostr.net',
              }
            });
          }
        } catch (testErr) {
          console.log(`[Movie ${tmdbId}] storm.vodvidl.site test failed: ${testErr.message}, trying backups...`);
        }
      } else {
        console.log(`[Movie ${tmdbId}] Vidlink SUCCESS`);
        return res.json({
          success: true,
          type: 'movie',
          tmdbId,
          streamUrl: vidlinkResult.streamUrl,
          provider: 'vidlink',
          referer: 'https://videostr.net/',
          headers: {
            'Referer': 'https://videostr.net/',
            'Origin': 'https://videostr.net',
          }
        });
      }
    }
    
    console.log(`[Movie ${tmdbId}] Vidlink failed or 403, trying backups...`);
    
    const backupStreams = await getAllBackupStreams(tmdbId, 'movie', null, null);
    
    if (backupStreams.length > 0) {
      const bestStream = backupStreams[0];
      console.log(`[Movie ${tmdbId}] Backup SUCCESS from ${bestStream.provider}`);
      
      return res.json({
        success: true,
        type: 'movie',
        tmdbId,
        streamUrl: bestStream.url,
        provider: bestStream.provider,
        headers: bestStream.headers,
        fallback: true,
        availableStreams: backupStreams.length,
      });
    }
    
    console.log(`[Movie ${tmdbId}] All providers failed`);
    res.status(404).json({ 
      success: false, 
      error: 'No stream found from any provider',
      tried: ['vidlink', ...backupProviders.map(p => p.id)]
    });
  } catch (err) {
    console.error(`[Movie ${tmdbId}] Error:`, err.message);
    res.status(502).json({ 
      success: false, 
      error: err.message 
    });
  }
});

app.get('/tv/:tmdbId/:season/:episode', async (req, res) => {
  const { tmdbId, season, episode } = req.params;
  
  try {
    // Try vidlink first (Go WASM)
    console.log(`[TV ${tmdbId} S${season}E${episode}] Trying vidlink.pro...`);
    const vidlinkResult = await extractVidlink(tmdbId, season, episode);
    
    if (vidlinkResult.streamUrl) {
      console.log(`[TV ${tmdbId} S${season}E${episode}] Vidlink SUCCESS`);
      return res.json({
        success: true,
        type: 'tv',
        tmdbId,
        season,
        episode,
        streamUrl: vidlinkResult.streamUrl,
        provider: 'vidlink',
        referer: 'https://videostr.net/',
        headers: {
          'Referer': 'https://videostr.net/',
          'Origin': 'https://videostr.net',
        }
      });
    }
    
    console.log(`[TV ${tmdbId} S${season}E${episode}] Vidlink failed, trying backups...`);
    
    // Fallback to backup providers
    const backupStreams = await getAllBackupStreams(tmdbId, 'tv', season, episode);
    
    if (backupStreams.length > 0) {
      const bestStream = backupStreams[0];
      console.log(`[TV ${tmdbId} S${season}E${episode}] Backup SUCCESS from ${bestStream.provider}`);
      
      return res.json({
        success: true,
        type: 'tv',
        tmdbId,
        season,
        episode,
        streamUrl: bestStream.url,
        provider: bestStream.provider,
        headers: bestStream.headers,
        fallback: true,
        availableStreams: backupStreams.length,
      });
    }
    
    console.log(`[TV ${tmdbId} S${season}E${episode}] All providers failed`);
    res.status(404).json({ 
      success: false, 
      error: 'No stream found from any provider',
      tried: ['vidlink', ...backupProviders.map(p => p.id)]
    });
  } catch (err) {
    console.error(`[TV ${tmdbId} S${season}E${episode}] Error:`, err.message);
    res.status(502).json({ 
      success: false, 
      error: err.message 
    });
  }
});

app.get('/stream', async (req, res) => {
  const { url, referer, origin } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'url parameter required' });
  }
  
  const targetUrl = decodeURIComponent(url);
  const ref = referer ? decodeURIComponent(referer) : 'https://videostr.net/';
  const org = origin ? decodeURIComponent(origin) : 'https://videostr.net';
  
  const headers = {
    'User-Agent': MODERN_UA,
    'Referer': ref,
    'Origin': org,
    'Accept': '*/*',
  };
  
  if (req.headers.range) {
    headers['Range'] = req.headers.range;
  }
  
  try {
    const response = await axios.get(targetUrl, {
      headers,
      responseType: 'stream',
      timeout: 30000,
      validateStatus: () => true,
    });
    
    res.status(response.status);
    if (response.headers['content-type']) res.set('Content-Type', response.headers['content-type']);
    if (response.headers['content-length']) res.set('Content-Length', response.headers['content-length']);
    if (response.headers['accept-ranges']) res.set('Accept-Ranges', response.headers['accept-ranges']);
    if (response.headers['content-range']) res.set('Content-Range', response.headers['content-range']);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    
    response.data.pipe(res);
  } catch (err) {
    res.status(502).json({ error: 'Proxy error: ' + err.message });
  }
});

app.get('/m3u8-proxy', async (req, res) => {
  const { url, referer, origin } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'url parameter required' });
  }
  
  const targetUrl = decodeURIComponent(url);
  const ref = referer ? decodeURIComponent(referer) : 'https://videostr.net/';
  const org = origin ? decodeURIComponent(origin) : 'https://videostr.net';
  
  const headers = {
    'User-Agent': MODERN_UA,
    'Referer': ref,
    'Origin': org,
    'Accept': '*/*',
  };
  
  try {
    const response = await axios.get(targetUrl, {
      headers,
      timeout: 30000,
      validateStatus: () => true,
    });
    
    let content = response.data;
    
    if (typeof content === 'string' && content.includes('#EXT')) {
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      
      content = content.replace(/^([^#\n].*\.m3u8.*)$/gm, (match, line) => {
        if (line.startsWith('http')) return line;
        return baseUrl + line;
      });
    }
    
    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(content);
  } catch (err) {
    res.status(502).json({ error: 'Proxy error: ' + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VidLink Render API (Go WASM + 11 backups) running on port ${PORT}`);
});

module.exports = app;
