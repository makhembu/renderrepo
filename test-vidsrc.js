const axios = require('axios');

const MODERN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function getVidSrcStreams(tmdbId, season = null, episode = null) {
  // Try multiple vidsrc domains
  const domains = [
    'https://vidsrc.to',
    'https://vidsrc.mov',
    'https://vidsrc.net',
  ];
  
  for (const domain of domains) {
    try {
      let url;
      if (season && episode) {
        url = `${domain}/embed/tv/${tmdbId}/${season}/${episode}`;
      } else {
        url = `${domain}/embed/movie/${tmdbId}`;
      }
      
      console.log(`Trying ${domain}...`);
      
      const resp = await axios.get(url, {
        timeout: 12000,
        headers: { 
          'User-Agent': MODERN_UA,
          'Referer': domain + '/',
        },
        validateStatus: () => true,
      });
      
      if (resp.status === 200 && resp.data) {
        // Try to find the actual stream URL in the response
        // The page loads content via JS - check for vsembed or similar
        const embedMatch = resp.data.match(/src="(https?:\/\/vsembed[^"]+)"/);
        if (embedMatch) {
          console.log(`  Found embed: ${embedMatch[1]}`);
          return embedMatch[1];
        }
      }
    } catch (e) {
      console.log(`  ${domain} error: ${e.message}`);
    }
  }
  
  return null;
}

getVidSrcStreams('603').then(r => console.log('Result:', r)).catch(e => console.log('Error:', e.message));