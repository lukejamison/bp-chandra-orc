# Quick Deployment Guide

Get your BP Chandra OCR app running in production in under 30 minutes!

## 🎯 Recommended Architecture

```
Frontend (Vercel) ←→ Backend (Railway) ←→ Redis (Railway/Upstash)
```

---

## 📦 Prerequisites

- [x] GitHub account
- [x] Vercel account (free)
- [x] Railway account (free) OR Render account
- [x] Git installed locally

---

## 🚀 Deployment Steps

### Step 1: Push to GitHub (2 minutes)

```bash
cd /Users/luke/Documents/GitHub/bp-chandra-orc

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: BP Chandra OCR"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/bp-chandra-orc.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy Python Backend to Railway (10 minutes)

#### A. Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"New Project"**

#### B. Deploy Backend
1. Click **"Deploy from GitHub repo"**
2. Select **`bp-chandra-orc`** repository
3. Click **"Add variables"** and set:

```env
API_KEY=your-super-secret-key-here-change-this
API_HOST=0.0.0.0
API_PORT=8001
MODEL_CHECKPOINT=datalab-to/chandra
OCR_METHOD=hf
MAX_OUTPUT_TOKENS=8192
LOG_LEVEL=INFO
CORS_ORIGINS=["https://your-app.vercel.app","http://localhost:3000"]
```

4. Click **"Settings"** → **"Root Directory"** → Set to **`python-backend`**
5. Click **"Settings"** → **"Start Command"** → Set to:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

6. Click **"Deploy"**

#### C. Add Redis
1. In the same Railway project, click **"New"** → **"Database"** → **"Add Redis"**
2. Railway will auto-generate `REDIS_URL`
3. Copy the Redis URL and add it to your backend variables:
   ```env
   REDIS_URL=redis://default:password@redis.railway.internal:6379
   ```

#### D. Get Backend URL
1. Once deployed, go to **"Settings"** → **"Generate Domain"**
2. Copy the URL (e.g., `https://your-app.railway.app`)
3. Save this - you'll need it for Vercel!

**Cost**: ~$5/month (Railway Hobby plan includes $5 credit)

---

### Step 3: Deploy Frontend to Vercel (5 minutes)

#### A. Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

#### B. Deploy Next.js App
1. Click **"Add New..."** → **"Project"**
2. Import **`bp-chandra-orc`** from GitHub
3. Vercel auto-detects Next.js - leave settings as default
4. Click **"Environment Variables"** and add:

```env
PYTHON_API_URL=https://your-app.railway.app
PYTHON_API_KEY=your-super-secret-key-here-change-this
MAX_FILE_SIZE=52428800
LOG_LEVEL=info
NODE_ENV=production
```

5. Click **"Deploy"**
6. Wait 2-3 minutes for build to complete
7. You'll get a URL like: `https://bp-chandra-orc.vercel.app`

#### C. Update CORS in Railway
1. Go back to Railway backend
2. Update `CORS_ORIGINS` environment variable:
   ```env
   CORS_ORIGINS=["https://bp-chandra-orc.vercel.app"]
   ```
3. Save and redeploy

**Cost**: $0 (Free tier)

---

### Step 4: Test Your Deployment (2 minutes)

1. Visit your Vercel URL: `https://bp-chandra-orc.vercel.app`
2. Upload a test document
3. Check processing status
4. View results!

---

## 🎛️ Alternative: Use Upstash for Redis (Optional)

If you want serverless Redis instead:

### Deploy to Upstash (5 minutes)

1. Go to [upstash.com](https://upstash.com)
2. Create account (free tier: 10,000 commands/day)
3. **"Create Database"** → Choose region closest to Railway
4. Copy **"REST URL"** 
5. Update Railway backend:
   ```env
   REDIS_URL=your-upstash-redis-url
   ```

**Cost**: $0 (Free tier sufficient for development)

---

## 💰 Cost Breakdown

### Development/Hobby
- **Vercel**: $0/month (Hobby tier)
- **Railway**: $5/month (includes $5 credit = free)
- **Total**: ~$0-5/month

### Production (Low Traffic)
- **Vercel**: $0-20/month
- **Railway**: $5-20/month
- **Total**: $5-40/month

### Production (High Traffic + GPU)
- **Vercel Pro**: $20/month
- **Railway with GPU**: $50-100/month
- **Total**: $70-120/month

---

## 🔧 Alternative Deployment Options

### Option B: All on Railway (Simpler, No Vercel)

**Pros**: Single platform, simpler setup  
**Cons**: No edge network, slower globally

```bash
# Deploy both frontend and backend to Railway
# Use Railway's built-in domains
```

**Cost**: ~$10-15/month

---

### Option C: Use Render instead of Railway

**Render.com** is similar to Railway:

1. Go to [render.com](https://render.com)
2. Create **"New Web Service"**
3. Connect GitHub repo
4. Set **Root Directory**: `python-backend`
5. Set **Start Command**: 
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
6. Add environment variables
7. Deploy!

**Pros**: Free tier available  
**Cons**: No GPU on free tier, slower cold starts

---

## 🆘 Troubleshooting

### Frontend can't connect to backend
- ✅ Check `PYTHON_API_URL` in Vercel environment variables
- ✅ Check `CORS_ORIGINS` in Railway includes your Vercel URL
- ✅ Verify Railway backend is running (check logs)
- ✅ Test backend directly: `curl https://your-app.railway.app/health`

### Backend crashes on startup
- ✅ Check Railway logs for errors
- ✅ Verify all environment variables are set
- ✅ Check `requirements.txt` has all dependencies
- ✅ Ensure Python 3.11+ is specified

### Redis connection fails
- ✅ Check `REDIS_URL` format is correct
- ✅ Verify Redis service is running in Railway
- ✅ Check network connectivity between services

### Upload fails
- ✅ Check file size under 50MB
- ✅ Verify `PYTHON_API_KEY` matches between frontend and backend
- ✅ Check backend logs for detailed error

---

## 🔐 Security Checklist

Before going live:

- [ ] Change default `API_KEY` to strong random string
- [ ] Update `CORS_ORIGINS` to only include your domain
- [ ] Enable HTTPS (automatic on Vercel/Railway)
- [ ] Set up environment variables (never commit secrets)
- [ ] Review file upload limits
- [ ] Set up monitoring/alerting

---

## 📊 Monitoring Your App

### Check Backend Health
```bash
curl https://your-app.railway.app/health
```

### View Logs
- **Railway**: Dashboard → Deployments → Logs
- **Vercel**: Dashboard → Deployments → Functions

### Monitor Usage
- **Railway**: Dashboard → Metrics
- **Vercel**: Dashboard → Analytics

---

## 🚀 Next Steps After Deployment

1. **Custom Domain**: Add your own domain in Vercel/Railway settings
2. **Monitoring**: Set up Sentry or LogRocket for error tracking
3. **Analytics**: Add Google Analytics or Plausible
4. **Backups**: Configure Redis persistence in Railway
5. **Scaling**: Monitor usage and upgrade plans as needed

---

## 💡 Pro Tips

1. **Use Railway for Everything**: Simpler than mixing services
2. **Enable GPU**: If processing > 100 docs/day, GPU worth it
3. **Upstash Redis**: Great for serverless, pay-per-use
4. **Monitor Costs**: Set up billing alerts in Railway
5. **Preview Deployments**: Vercel creates preview URLs for PRs automatically

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Upstash Documentation](https://docs.upstash.com)

---

**Estimated Setup Time**: 30 minutes  
**Monthly Cost**: $5-40 depending on usage  
**Difficulty**: Beginner-friendly ⭐⭐⭐

Need help? Check the main README.md or open an issue on GitHub!


