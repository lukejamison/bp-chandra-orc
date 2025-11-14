# Railway Setup Guide - Complete Walkthrough

Follow these steps to deploy your Python backend to Railway and get your API URL.

---

## 📋 Prerequisites

- [x] Railway account created at [railway.app](https://railway.app)
- [x] Code pushed to GitHub
- [x] This guide open!

---

## 🚀 Part 1: Deploy Backend to Railway

### Step 1: Create New Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select the **`bp-chandra-orc`** repository

---

### Step 2: Configure the Service

Railway will create a service, but we need to configure it:

#### A. Set Root Directory

1. Click on the service card (it will say "Service" or show your repo name)
2. Go to **"Settings"** tab
3. Scroll to **"Root Directory"**
4. Enter: **`python-backend`**
5. Click **"Save"**

**Why?** Your Python code is in the `python-backend` folder, not the root.

#### B. Set Start Command

1. Still in **"Settings"** tab
2. Scroll to **"Start Command"**
3. Enter:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
4. Click **"Save"**

**Note**: Railway provides `$PORT` automatically - don't change it!

---

### Step 3: Add Environment Variables

This is where you create your API key!

1. Click on your service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add each of these (click **"+ New Variable"** for each one):

```env
API_KEY=your-super-secret-key-change-this-to-something-random
API_HOST=0.0.0.0
MODEL_CHECKPOINT=datalab-to/chandra
OCR_METHOD=hf
MAX_OUTPUT_TOKENS=8192
LOG_LEVEL=INFO
CORS_ORIGINS=["http://localhost:3000"]
```

**🔐 IMPORTANT - API_KEY**: 
- This is YOUR API key that you create!
- Make it random and secure
- Example: `sk_live_abc123xyz789_super_secret`
- **Save this somewhere safe** - you'll need it for Vercel later!

**Pro Tip**: Generate a random API key:
```bash
# On Mac/Linux:
openssl rand -hex 32

# This gives you something like:
# a3f5c8e9d2b4f6a8c1e3d5f7b9c0e2f4a6b8d0e2f4c6e8f0b2d4f6a8c0e2f4a6
```

---

### Step 4: Add Redis Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"**
3. Choose **"Add Redis"**
4. Railway will automatically create a Redis instance
5. **Important**: The `REDIS_URL` variable is automatically added to your service!

You don't need to do anything else - Railway handles the connection automatically! ✨

---

### Step 5: Deploy!

1. Railway should start deploying automatically
2. You'll see build logs in the **"Deployments"** tab
3. Wait 2-5 minutes for the build to complete
4. Look for: ✅ **"Build successful"** and ✅ **"Deployed"**

---

### Step 6: Generate Public Domain (Get Your URL!)

This is the PYTHON_API_URL you need!

1. Click on your service
2. Go to **"Settings"** tab
3. Scroll to **"Networking"** section
4. Under **"Public Networking"**, click **"Generate Domain"**
5. Railway will create a URL like: `https://bp-chandra-orc-production-xxxx.up.railway.app`

**🎉 THIS IS YOUR PYTHON_API_URL!**

Copy this URL - you'll need it for Vercel!

---

### Step 7: Update CORS

Now that you have your frontend URL (or will soon), update CORS:

1. Go back to **"Variables"** tab
2. Find `CORS_ORIGINS`
3. Click to edit
4. Update to include your Vercel URL:
   ```env
   CORS_ORIGINS=["https://your-app.vercel.app","http://localhost:3000"]
   ```
5. Click **"Save"**
6. Service will redeploy automatically

**Note**: If you haven't deployed to Vercel yet, you can update this later!

---

### Step 8: Test Your Backend

Test that your backend is working:

```bash
# Replace with YOUR Railway URL
curl https://your-backend.railway.app/health

# You should see:
# {
#   "status": "healthy",
#   "timestamp": "2024-...",
#   "version": "0.1.0",
#   "services": {
#     "api": "healthy",
#     "redis": "healthy",
#     "ocr": "healthy"
#   }
# }
```

✅ If you see this, your backend is working!

---

## 🎯 Part 2: Use Your URLs in Vercel

Now that you have your Railway backend URL, let's deploy the frontend!

### Option A: Deploy to Vercel Now

1. Open terminal in your project:
   ```bash
   cd /Users/luke/Documents/GitHub/bp-chandra-orc
   ```

2. Install Vercel CLI (if not installed):
   ```bash
   npm install -g vercel
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - **Set up and deploy?** → `Y`
   - **Which scope?** → Choose your account
   - **Link to existing project?** → `N`
   - **What's your project's name?** → `bp-chandra-orc`
   - **In which directory is your code located?** → `./` (just press Enter)
   - **Want to override settings?** → `N`

5. Vercel will build and deploy! You'll get a URL like:
   ```
   https://bp-chandra-orc-xxxx.vercel.app
   ```

---

### Step 9: Add Environment Variables to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **`bp-chandra-orc`** project
3. Go to **"Settings"** → **"Environment Variables"**
4. Add these variables:

```env
# Your Railway backend URL (from Step 6)
PYTHON_API_URL=https://your-backend.railway.app

# Your API key (same one you set in Railway)
PYTHON_API_KEY=your-super-secret-key-change-this-to-something-random

# Other settings
MAX_FILE_SIZE=52428800
LOG_LEVEL=info
NODE_ENV=production
```

5. Click **"Save"**
6. Go to **"Deployments"** tab
7. Click **"..."** on the latest deployment → **"Redeploy"**

---

### Step 10: Update Railway CORS (Final Step!)

Now that you have your Vercel URL:

1. Go back to Railway
2. Click your service → **"Variables"**
3. Update `CORS_ORIGINS`:
   ```env
   CORS_ORIGINS=["https://bp-chandra-orc-xxxx.vercel.app"]
   ```
4. Replace with YOUR actual Vercel URL
5. Save (auto-redeploys)

---

## ✅ Verification Checklist

- [ ] Railway backend is deployed and healthy
- [ ] Redis is connected (check service logs)
- [ ] You have your Railway URL (PYTHON_API_URL)
- [ ] You created and saved your API_KEY
- [ ] Vercel frontend is deployed
- [ ] Environment variables set in Vercel
- [ ] CORS updated in Railway with Vercel URL
- [ ] Frontend can reach backend

---

## 🧪 Test Your Full App

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try uploading a document
3. Watch the processing status
4. See the results!

---

## 🔍 Troubleshooting

### Backend won't start?

**Check Railway logs**:
1. Railway → Your service → **"Deployments"** tab
2. Click on latest deployment
3. View logs for errors

**Common issues**:
- ❌ Missing environment variables → Add them in Variables tab
- ❌ Wrong Root Directory → Should be `python-backend`
- ❌ Wrong Start Command → See Step 2B above

### Frontend can't connect to backend?

**Check these**:
1. ✅ PYTHON_API_URL is correct in Vercel
2. ✅ API_KEY matches between Vercel and Railway
3. ✅ CORS_ORIGINS includes your Vercel URL
4. ✅ Railway service is running (not crashed)

**Test backend directly**:
```bash
curl https://your-backend.railway.app/health
```

### "API key invalid" error?

**Fix**:
1. Check Railway Variables → API_KEY
2. Check Vercel Variables → PYTHON_API_KEY
3. Make sure they EXACTLY match!
4. Redeploy both services after changing

### Upload fails?

**Check**:
1. File size under 50MB
2. File type is PDF, PNG, JPG, or WEBP
3. Check Railway logs for detailed error
4. Check browser console for frontend errors

---

## 📊 Monitor Your App

### Railway Monitoring

**View Logs**:
- Railway → Service → Deployments → Click deployment → Logs

**Check Metrics**:
- Railway → Service → Metrics tab
- See CPU, Memory, Network usage

**Check Redis**:
- Railway → Redis service → Metrics
- See memory usage, connections

### Vercel Monitoring

**View Logs**:
- Vercel → Project → Deployments → Click deployment → Function Logs

**Check Analytics**:
- Vercel → Project → Analytics
- See visitor stats, performance

---

## 💰 Cost Tracking

### Railway Costs

Check usage:
1. Railway → Account Settings → Usage
2. You get **$5/month free credit**
3. Beyond that:
   - CPU: ~$0.000463/min
   - Memory: ~$0.000231/GB/min
   - Typically: $5-20/month for this app

### Vercel Costs

**Hobby tier**: 
- Free for personal projects
- Unlimited bandwidth
- 100GB/month storage

**Pro tier** ($20/month):
- Needed for commercial use
- More compute time
- Team features

---

## 🎉 Success!

You should now have:
- ✅ Backend running on Railway
- ✅ Frontend running on Vercel  
- ✅ Redis for job tracking
- ✅ Full OCR app working!

---

## 📝 Save These URLs

Write these down somewhere safe:

```
Railway Backend URL: https://your-backend.railway.app
Vercel Frontend URL: https://your-app.vercel.app
API Key: your-super-secret-key
```

---

## 🚀 Next Steps

1. **Custom Domain**: Add your own domain in Vercel/Railway settings
2. **Monitoring**: Set up Sentry for error tracking
3. **Analytics**: Add analytics to track usage
4. **GPU**: If processing > 100 docs/month, upgrade Railway to GPU

---

## 🆘 Need Help?

If you get stuck:

1. Check Railway logs (Deployments tab)
2. Check Vercel logs (Functions tab)
3. Test backend directly with curl
4. Review environment variables
5. Check CORS settings

Still stuck? Share the error message and I'll help debug!

---

**Deployment Time**: ~15 minutes  
**Monthly Cost**: $0-5 (with free credits)  
**Difficulty**: Easy ⭐⭐

Your app is now live and accessible worldwide! 🌍


