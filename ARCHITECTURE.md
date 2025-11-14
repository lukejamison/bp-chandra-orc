# BP Chandra OCR Architecture Guide

Understanding how everything fits together.

---

## 🏗️ System Architecture

### Current Design: 3-Tier Hybrid Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                       │
│                     (Anywhere in the world)                  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    TIER 1: FRONTEND (Vercel)                 │
├─────────────────────────────────────────────────────────────┤
│  Next.js Application                                         │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   Web Pages      │  │   API Routes     │                │
│  │                  │  │                  │                │
│  │  - Upload UI     │  │  - /api/ocr/*    │                │
│  │  - Status View   │  │  - /api/health   │                │
│  │  - Results       │  │  (Middleware)    │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  📦 Static Files (JS, CSS, Images)                          │
│  🌍 Global Edge Network (Fast worldwide)                    │
│  💰 Free Tier: Unlimited bandwidth                          │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTP API Calls
                             │ (With API Key)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│               TIER 2: BACKEND (Railway/Render)               │
├─────────────────────────────────────────────────────────────┤
│  Python FastAPI Application                                  │
│  ┌──────────────────────────────────────────────┐          │
│  │           FastAPI REST API                    │          │
│  │  /health, /api/v1/ocr/*, /docs               │          │
│  └─────────────────┬────────────────────────────┘          │
│                    │                                         │
│  ┌─────────────────▼────────────────────────────┐          │
│  │         Chandra OCR Service                   │          │
│  │  - Load ML models (2-5GB)                    │          │
│  │  - Process documents                          │          │
│  │  - GPU acceleration (optional)                │          │
│  │  - Extract text, tables, images               │          │
│  └─────────────────┬────────────────────────────┘          │
│                    │                                         │
│  ┌─────────────────▼────────────────────────────┐          │
│  │           Job Manager                         │          │
│  │  - Track processing status                    │          │
│  │  - Queue management                           │          │
│  │  - Store results                              │          │
│  └─────────────────┬────────────────────────────┘          │
│                    │                                         │
│  🖥️  Server: 2-4 CPU cores, 4-8GB RAM                      │
│  🎮 Optional: GPU for 10x speed boost                      │
│  💰 Cost: ~$5-20/month (CPU) or $50-100/month (GPU)        │
└────────────────────┴────────────────────────────────────────┘
                     │
                     │ Redis Protocol
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              TIER 3: REDIS (Railway/Upstash)                 │
├─────────────────────────────────────────────────────────────┤
│  Job Queue & Cache                                           │
│  ┌──────────────────────────────────────────────┐          │
│  │  Job Status Storage                           │          │
│  │  - job:123 → { status: "processing" }        │          │
│  │  - job:456 → { status: "completed" }         │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  💾 Memory: 256MB - 1GB                                     │
│  💰 Cost: $0 (free tier) or $5-10/month                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow: How a Document Gets Processed

### Step-by-Step Flow

```
1. USER UPLOADS FILE
   │
   ├─→ Browser → Vercel Next.js (/api/ocr/process)
   │
2. VERCEL MIDDLEWARE
   │
   ├─→ Validates file (size, type)
   ├─→ Creates FormData
   ├─→ Forwards to Python Backend
   │
3. PYTHON BACKEND RECEIVES
   │
   ├─→ Validates API key
   ├─→ Saves file to temp storage
   ├─→ Creates Job ID
   ├─→ Stores in Redis: job:abc123 → { status: "pending" }
   ├─→ Returns Job ID to frontend
   │
4. FRONTEND POLLS STATUS
   │
   ├─→ Every 5 seconds: GET /api/ocr/status/abc123
   ├─→ Backend checks Redis
   ├─→ Returns current status
   │
5. PYTHON PROCESSES DOCUMENT
   │
   ├─→ Load Chandra OCR model (if not loaded)
   ├─→ Convert PDF to images (if PDF)
   ├─→ Run OCR on each page
   ├─→ Extract text, tables, formatting
   ├─→ Update Redis: job:abc123 → { status: "processing" }
   │
6. PROCESSING COMPLETES
   │
   ├─→ Store result in Redis
   ├─→ Update: job:abc123 → { status: "completed", result: {...} }
   │
7. FRONTEND FETCHES RESULT
   │
   ├─→ GET /api/ocr/result/abc123
   ├─→ Display to user
   │
8. USER DOWNLOADS
   │
   └─→ Copy or download as MD/HTML/JSON
```

---

## 🔄 Why This Architecture?

### Problem: Can't Run Everything on Vercel

| Requirement | Vercel Serverless | Railway Server |
|-------------|-------------------|----------------|
| **Execution Time** | 10-60 seconds max | Unlimited ✅ |
| **Memory** | 1-3GB | 4-16GB ✅ |
| **GPU Access** | ❌ No | ✅ Yes (optional) |
| **Model Size** | Cold start penalty | ✅ Stays loaded |
| **Cost for OCR** | $$$ High | $ Reasonable ✅ |
| **Timeout Risk** | ⚠️ High | ✅ None |

### Solution: Split Responsibilities

**Vercel (Frontend)**: 
- ✅ What it's GREAT at: Serving web pages, static files, edge caching
- ✅ Fast globally (edge network)
- ✅ Free tier generous
- ❌ NOT good at: Heavy compute, long processes, ML

**Railway (Backend)**:
- ✅ What it's GREAT at: Long-running processes, heavy compute, ML models
- ✅ No timeout limits
- ✅ Can add GPU
- ✅ Affordable for compute
- ❌ NOT optimized for: Serving static files globally

---

## 🎯 Deployment Scenarios

### Scenario 1: Personal/Learning Project

**Stack**: 
- Frontend: Vercel (Free)
- Backend: Railway (Free tier / $5)
- Redis: Upstash (Free)

**Cost**: $0-5/month  
**Performance**: Good for learning  
**Traffic**: ~100 documents/month  

```bash
# Deploy in 15 minutes
./start.sh  # Local testing
vercel      # Deploy frontend
# Connect Railway via GitHub
```

---

### Scenario 2: Small Business/Startup

**Stack**:
- Frontend: Vercel Pro ($20/month)
- Backend: Railway with GPU ($50-75/month)
- Redis: Railway Redis ($10/month)

**Cost**: $80-105/month  
**Performance**: Production-ready  
**Traffic**: ~1,000-10,000 documents/month  

**Features**:
- ✅ Custom domain
- ✅ GPU acceleration (10x faster)
- ✅ Team collaboration
- ✅ Analytics

---

### Scenario 3: Enterprise/High Volume

**Stack**:
- Frontend: Vercel Enterprise
- Backend: AWS EC2 with GPU (p3.2xlarge)
- Redis: AWS ElastiCache
- Load Balancer: AWS ALB

**Cost**: $500-2,000/month  
**Performance**: High-scale production  
**Traffic**: 100,000+ documents/month  

**Features**:
- ✅ Multi-region
- ✅ Auto-scaling
- ✅ 99.9% uptime SLA
- ✅ Advanced monitoring

---

## 🤔 Alternative Architectures

### Alt 1: Simplified (All Railway)

```
User → Railway (Next.js + Python + Redis)
```

**Pros**:
- ✅ Single platform
- ✅ Simpler setup
- ✅ One bill

**Cons**:
- ❌ No edge network (slower globally)
- ❌ Lose Vercel's Next.js optimizations
- ❌ More expensive (must run Next.js server)

**Best for**: Internal tools, single-region apps

---

### Alt 2: Serverless Everything (Vercel + Managed API)

```
User → Vercel → Datalab.to Chandra API (paid)
```

**Pros**:
- ✅ Simplest possible
- ✅ No backend to manage
- ✅ Professional infrastructure

**Cons**:
- ❌ Recurring API costs
- ❌ Less control/customization
- ❌ Depends on third-party

**Best for**: MVPs, when you don't want to manage infrastructure

---

### Alt 3: Edge-First (Vercel + Edge Functions)

```
User → Vercel Edge Functions → External Python API
```

**Pros**:
- ✅ Ultra-low latency
- ✅ Global distribution

**Cons**:
- ❌ Still need Python backend for OCR
- ❌ Complex setup
- ❌ Higher costs

**Best for**: When latency is critical

---

## 💡 Decision Matrix

Choose your deployment based on:

### If you're **learning/prototyping**:
→ **Local development** (Docker Compose)  
Cost: $0  
Time: 5 minutes

### If you want **simple deployment**:
→ **Vercel + Railway** (Recommended)  
Cost: $5-20/month  
Time: 30 minutes

### If you need **maximum performance**:
→ **Vercel + AWS GPU**  
Cost: $100-500/month  
Time: 2-4 hours

### If you want **zero maintenance**:
→ **Vercel + Managed OCR API**  
Cost: Pay per use  
Time: 10 minutes

---

## 🚀 Quick Start Commands

### Local Development
```bash
# Everything on your machine
docker-compose -f docker-compose.dev.yml up
```

### Production (Recommended)
```bash
# Step 1: Deploy backend to Railway
# (Use Railway UI - connect GitHub)

# Step 2: Deploy frontend to Vercel
vercel --prod

# Step 3: Configure environment variables
# (In each platform's dashboard)
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────┐
│  Security Layers                         │
├─────────────────────────────────────────┤
│  1. HTTPS/TLS (Automatic)               │
│     - Vercel provides SSL               │
│     - Railway provides SSL              │
│                                         │
│  2. API Key Authentication              │
│     - X-API-Key header                  │
│     - Shared secret                     │
│                                         │
│  3. CORS Protection                     │
│     - Only allow Vercel domain          │
│     - Block other origins               │
│                                         │
│  4. Input Validation                    │
│     - File type checking                │
│     - Size limits                       │
│     - Schema validation (Zod/Pydantic)  │
│                                         │
│  5. Rate Limiting (TODO)                │
│     - Prevent abuse                     │
│     - IP-based limits                   │
└─────────────────────────────────────────┘
```

---

## 📈 Scaling Strategy

### Phase 1: Single Instance (0-1K docs/month)
- 1 Railway dyno
- Free Redis
- Vercel free tier

### Phase 2: Vertical Scaling (1K-10K docs/month)
- Larger Railway instance
- Add GPU
- Vercel Pro

### Phase 3: Horizontal Scaling (10K+ docs/month)
- Multiple backend instances
- Load balancer
- Managed Redis cluster
- CDN for results

---

## 📚 Technology Choices Explained

### Why Next.js?
- ✅ React framework with great DX
- ✅ API routes for middleware
- ✅ Optimized for Vercel
- ✅ SSR/SSG/ISR support
- ✅ Great ecosystem

### Why FastAPI (Python)?
- ✅ Fast, modern Python framework
- ✅ Automatic API docs
- ✅ Great for ML/AI workloads
- ✅ Async support
- ✅ Type hints + validation

### Why Redis?
- ✅ Fast in-memory storage
- ✅ Perfect for job queues
- ✅ Simple key-value operations
- ✅ Widely supported
- ✅ Cheap/free tiers available

### Why Separate Services?
- ✅ Each tool does what it's best at
- ✅ Independent scaling
- ✅ Better performance
- ✅ More reliable
- ✅ Cost-effective

---

## 🎓 Summary

**You CANNOT combine Python + Next.js on Vercel effectively for OCR** because:
1. Serverless timeout limits (60s max)
2. No GPU support
3. Cold starts with large ML models
4. Memory constraints

**The BEST solution is hybrid**:
- **Vercel**: Frontend (what it's amazing at)
- **Railway**: Backend (handles heavy OCR)
- **Redis**: Job queue (fast status tracking)

**Total setup time**: 30 minutes  
**Monthly cost**: $5-40  
**Performance**: Production-ready  

---

Need help choosing? Ask yourself:

1. **Budget**: < $10/month → Use free tiers
2. **Volume**: < 100 docs/month → CPU is fine
3. **Volume**: > 1000 docs/month → Get GPU
4. **Simplicity**: Want easiest → Use managed API
5. **Control**: Need customization → Self-host (Railway)

**For most people**: Vercel + Railway is perfect! 🎯


