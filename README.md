# VidLink Render API

VidLink.pro streaming API with built-in proxy. Deploys to Render, Railway, or any Node.js host.

## Features

- **Direct VidLink API**: Fast extraction from vidlink.pro
- **Built-in Proxy**: Handles referer/origin headers automatically
- **HLS Support**: Proxies m3u8 playlists and TS segments
- **No Cloudflare Blocks**: Runs on VPS, not Cloudflare Workers

## Deploy to Render

### 1. Create New Web Service

1. Go to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `vidlink-render-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 2. Deploy

Click **Create Web Service**. Your API will be at:
```
https://vidlink-render-api.onrender.com
```

## API Endpoints

### GET /health

```json
{
  "status": "ok",
  "source": "vidlink.pro",
  "uptime": 123.45
}
```

### GET /movie/:tmdbId

```bash
GET https://your-app.onrender.com/movie/385687
```

Response:
```json
{
  "success": true,
  "type": "movie",
  "tmdbId": "385687",
  "streamUrl": "https://frostcomet5.pro/.../playlist.m3u8",
  "referer": "https://videostr.net/",
  "headers": {
    "Referer": "https://videostr.net/",
    "Origin": "https://videostr.net"
  }
}
```

### GET /tv/:tmdbId/:season/:episode

```bash
GET https://your-app.onrender.com/tv/1399/1/1
```

### GET /stream?url=ENCODED_URL&referer=ENCODED_REFERER

Proxy endpoint:
```bash
GET https://your-app.onrender.com/stream?url=https%3A%2F%2F...%2Fplaylist.m3u8&referer=https%3A%2F%2Fvideostr.net%2F
```

### GET /m3u8-proxy?url=ENCODED_URL&referer=ENCODED_REFERER

Proxies and rewrites m3u8 playlists.

## Usage in Your App

### Option 1: Direct Stream (with headers)

```javascript
const res = await fetch('https://your-app.onrender.com/movie/385687');
const data = await res.json();

// Your player needs to support headers
player.load(data.streamUrl, {
  headers: data.headers
});
```

### Option 2: Use Proxy (no headers needed)

```javascript
const res = await fetch('https://your-app.onrender.com/movie/385687');
const data = await res.json();

// Use proxied URL
const proxyUrl = `https://your-app.onrender.com/stream?url=${encodeURIComponent(data.streamUrl)}&referer=${encodeURIComponent(data.headers.Referer)}`;
player.load(proxyUrl);
```

## Local Development

```bash
cd render-stream-api
npm install
npm start
```

API runs at `http://localhost:3000`

## Test

```bash
# Health
curl https://your-app.onrender.com/health

# Movie
curl https://your-app.onrender.com/movie/385687

# TV
curl https://your-app.onrender.com/tv/1399/1/1
```

## Notes

- **Free Tier**: Render spins down after 15 min (cold start ~30s)
- **Upgrade**: $7/month for always-on
- **vidlink.pro**: Fast provider, may change domains occasionally

## License

MIT