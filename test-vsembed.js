const axios = require('axios');

const MODERN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function getVsembedStreams(tmdbId, season = null, episode = null) {
  const url = season 
    ? `https://vsembed.ru/embed/tv/${tmdbId}/${season}/${episode}/`
    : `https://vsembed.ru/embed/movie/${tmdbId}/`;
  
  console.log(`Fetching ${url}...`);
  
  try {
    const resp = await axios.get(url, {
      timeout: 15000,
      headers: { 
        'User-Agent': MODERN_UA,
        'Referer': 'https://vidsrc.to/',
      },
    });
    
    const data = resp.data;
    
    // Look for m3u8 in the response
    // Often it's in a "sources" object or as a video source
    const patterns = [
      /sources/,
      /file.*\.m3u8/,
      /playUrl/,
      /src.*\.m3u8/,
      /https:\/\/[^"'\s]+\.m3u8/,
    ];
    
    for (const pattern of patterns) {
      const match = data.match(pattern);
      if (match) {
        console.log(`Found match: ${match[0].substring(0, 80)}...`);
      }
    }
    
    // Check for eval() with encoded JS
    if (data.includes('eval(')) {
      console.log('Contains eval - likely obfuscated JS');
    }
    
    // Print a section of the response
    console.log('Response sample:', data.substring(0, 2000));
    
  } catch(e) {
    console.log('Error:', e.message);
  }
}

getVsembedStreams('603');