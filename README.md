# VidLink Render API

Multi-provider streaming API with built-in proxy. Deploys to Render, Railway, or any Node.js host.

## Features

- **Primary**: vidlink.pro via Go WASM extraction
- **11 Backup Providers**: 4KHDHub, MoviesMod, MP4Hydra, VidZee, VixSrc, UHDMovies, ShowBox, ZoeChip, SmashyStream, FlixHQ, GoMovies
- **Auto-Failover**: Automatically tries all providers if vidlink fails
- **Built-in Proxy**: Handles referer/origin headers automatically
- **HLS Support**: Proxies m3u8 playlists and TS segments
- **No Cloudflare Blocks**: Runs on VPS, not Cloudflare Workers

## Deploy to Render

### 1. Push to GitHub

```bash
cd renderstream
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

### 2. Create Render Web Service

1. Go to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `vidlink-render-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 3. Deploy

Your API will be at:
```
https://vidlink-render-api.onrender.com
```

## API Endpoints

### GET /health

```json
{
  "status": "ok",
  "source": "vidlink.pro (Go WASM) + 11 backup providers",
  "providers": ["4khdhub", "moviesmod", "mp4hydra", ...],
  "uptime": 123.45
}
```

### GET /movie/:tmdbId

```bash
GET https://your-app.onrender.com/movie/385687
```

Response (vidlink success):
```json
{
  "success": true,
  "type": "movie",
  "tmdbId": "385687",
  "streamUrl": "https://frostcomet5.pro/.../playlist.m3u8",
  "provider": "vidlink",
  "referer": "https://videostr.net/",
  "headers": {
    "Referer": "https://videostr.net/",
    "Origin": "https://videostr.net"
  }
}
```

Response (fallback to backup):
```json
{
  "success": true,
  "type": "movie",
  "tmdbId": "385687",
  "streamUrl": "https://4khdhub.com/.../playlist.m3u8",
  "provider": "4khdhub",
  "headers": {
    "Referer": "https://4khdhub.com/",
    "Origin": "https://4khdhub.com"
  },
  "fallback": true,
  "availableStreams": 5
}
```

### GET /tv/:tmdbId/:season/:episode

```bash
GET https://your-app.onrender.com/tv/1399/1/1
```

### GET /stream?url=ENCODED_URL&referer=ENCODED_REFERER

Proxy endpoint for playing streams with headers.

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
cd renderstream
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

## Provider Fallback Order

1. **vidlink.pro** (Go WASM extraction) - Primary
2. **4KHDHub** - Backup 1
3. **MoviesMod** - Backup 2
4. **MP4Hydra** - Backup 3
5. **VidZee** - Backup 4
6. **VixSrc** - Backup 5
7. **UHDMovies** - Backup 6
8. **ShowBox** - Backup 7
9. **ZoeChip** - Backup 8
10. **SmashyStream** - Backup 9
11. **FlixHQ** - Backup 10
12. **GoMovies** - Backup 11

## Notes

- **Free Tier**: Render spins down after 15 min (cold start ~30s)
- **Upgrade**: $7/month for always-on
- **vidlink.pro**: Uses Go WASM for token extraction
- **Backups**: Scraped from multiple sources for redundancy

## Troubleshooting

### No streams found
- All providers may be down temporarily
- Check Render logs for details
- Try different TMDB IDs

### 403 on stream
- Use the `/stream` or `/m3u8-proxy` endpoint
- Check provider headers in response

### Cold starts
- Upgrade to paid Render plan for always-on
- Or use a ping service to keep it warm

## License

MIT