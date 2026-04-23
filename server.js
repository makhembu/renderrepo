const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const MODERN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const VIDLINK_BASE = 'https://vidlink.pro';

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    source: 'vidlink.pro',
    uptime: process.uptime(),
  });
});

app.get('/movie/:tmdbId', async (req, res) => {
  const { tmdbId } = req.params;
  
  try {
    const resp = await axios.get(`${VIDLINK_BASE}/api/movie/${tmdbId}`, {
      timeout: 15000,
      headers: {
        'User-Agent': MODERN_UA,
        'Accept': 'application/json',
      },
      validateStatus: () => true,
    });
    
    const data = resp.data;
    
    if (!data.success || !data.data?.stream?.playlist) {
      return res.status(404).json({ success: false, error: 'No stream found' });
    }
    
    const streamUrl = data.data.stream.playlist;
    
    res.json({
      success: true,
      type: 'movie',
      tmdbId,
      streamUrl,
      referer: 'https://videostr.net/',
      headers: {
        'Referer': 'https://videostr.net/',
        'Origin': 'https://videostr.net',
      }
    });
  } catch (err) {
    res.status(502).json({ 
      success: false, 
      error: err.message 
    });
  }
});

app.get('/tv/:tmdbId/:season/:episode', async (req, res) => {
  const { tmdbId, season, episode } = req.params;
  
  try {
    const resp = await axios.get(`${VIDLINK_BASE}/api/tv/${tmdbId}/${season}/${episode}`, {
      timeout: 15000,
      headers: {
        'User-Agent': MODERN_UA,
        'Accept': 'application/json',
      },
      validateStatus: () => true,
    });
    
    const data = resp.data;
    
    if (!data.success || !data.data?.stream?.playlist) {
      return res.status(404).json({ success: false, error: 'No stream found' });
    }
    
    const streamUrl = data.data.stream.playlist;
    
    res.json({
      success: true,
      type: 'tv',
      tmdbId,
      season,
      episode,
      streamUrl,
      referer: 'https://videostr.net/',
      headers: {
        'Referer': 'https://videostr.net/',
        'Origin': 'https://videostr.net',
      }
    });
  } catch (err) {
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
  console.log(`VidLink Render API running on port ${PORT}`);
});

module.exports = app;
