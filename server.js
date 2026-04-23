const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const MODERN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const iframeProviders = [
  { id: 'vidsrc', domain: 'https://vidsrc.to', embed: '/embed' },
  { id: 'vidsrcmov', domain: 'https://vidsrc.mov', embed: '/embed' },
  { id: 'vidsrcnet', domain: 'https://vidsrc.net', embed: '/embed' },
];

function buildEmbedUrl(provider, tmdbId, season, episode) {
  if (season && episode) {
    return `${provider.domain}${provider.embed}/tv/${tmdbId}/${season}/${episode}`;
  }
  return `${provider.domain}${provider.embed}/movie/${tmdbId}`;
}

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    source: 'vidsrc iframe embeds',
    providers: iframeProviders.map(p => p.id),
    uptime: process.uptime(),
  });
});

app.get('/movie/:tmdbId', (req, res) => {
  const { tmdbId } = req.params;
  
  const embeds = iframeProviders.map(p => ({
    provider: p.id,
    embedUrl: buildEmbedUrl(p, tmdbId, null, null),
    type: 'iframe',
  }));
  
  res.json({
    success: true,
    type: 'movie',
    tmdbId,
    embeds,
    defaultEmbed: embeds[0].embedUrl,
  });
});

app.get('/tv/:tmdbId/:season/:episode', (req, res) => {
  const { tmdbId, season, episode } = req.params;
  
  const embeds = iframeProviders.map(p => ({
    provider: p.id,
    embedUrl: buildEmbedUrl(p, tmdbId, season, episode),
    type: 'iframe',
  }));
  
  res.json({
    success: true,
    type: 'tv',
    tmdbId,
    season,
    episode,
    embeds,
    defaultEmbed: embeds[0].embedUrl,
  });
});

app.get('/stream', async (req, res) => {
  const { url, referer, origin } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'url parameter required' });
  }
  
  const targetUrl = decodeURIComponent(url);
  const ref = referer ? decodeURIComponent(referer) : 'https://vidsrc.to/';
  const org = origin ? decodeURIComponent(origin) : 'https://vidsrc.to';
  
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VidSrc Embed API running on port ${PORT}`);
});

module.exports = app;