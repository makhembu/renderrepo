# Deploy Render Stream API

## Step 1: Push to GitHub

1. Create a new GitHub repo (e.g., `render-stream-api`)
2. Upload all files from this folder:
   - server.js
   - package.json
   - README.md
   - .render.yaml

## Step 2: Deploy to Render

1. Go to https://render.com and sign in
2. Click **New +** → **Web Service**
3. Connect your GitHub account
4. Select your `render-stream-api` repository
5. Configure:
   ```
   Name: render-stream-api
   Region: Choose closest to you
   Branch: main
   Root Directory: (leave blank)
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```
6. Click **Create Web Service**

## Step 3: Get Your URL

After deployment completes (~2-5 minutes), you'll get a URL like:
```
https://render-stream-api-xxxx.onrender.com
```

## Step 4: Update Shelflix

Update `lib/constants.ts` in your Shelflix app:

```typescript
export const STREAM_API_URL = 'https://render-stream-api-xxxx.onrender.com';
```

## Step 5: Update API Route

Update `app/api/vidlink/route.ts`:

```typescript
// Change from stream-api.shelflix.workers.dev to your Render URL
const STREAM_API_URL = 'https://render-stream-api-xxxx.onrender.com';
```

## Notes

- **Free tier** spins down after 15 min of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- Consider upgrading to **$7/month** for always-on

## Test Your Deployment

```bash
# Health check
curl https://your-app.onrender.com/health

# Get movie streams
curl https://your-app.onrender.com/movie/385687

# Get TV streams
curl https://your-app.onrender.com/tv/1399/1/1
```