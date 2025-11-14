# Deployment Guide

Complete guide for deploying the Chandra OCR application to various platforms.

## Table of Contents

1. [Vercel Deployment (Frontend)](#vercel-deployment)
2. [Railway Deployment (Backend)](#railway-deployment)
3. [Docker Deployment](#docker-deployment)
4. [AWS Deployment](#aws-deployment)
5. [Google Cloud Deployment](#google-cloud-deployment)
6. [Configuration](#configuration)
7. [Monitoring](#monitoring)

---

## Vercel Deployment

Deploy the Next.js frontend to Vercel.

### Prerequisites

- Vercel account
- Python backend deployed separately (see other sections)
- Redis instance (managed or self-hosted)

### Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Configure Environment Variables**
   
   In your Vercel project settings, add:
   ```
   PYTHON_API_URL=https://your-python-backend.com
   PYTHON_API_KEY=your-secret-key
   MAX_FILE_SIZE=52428800
   LOG_LEVEL=info
   NODE_ENV=production
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Custom Domain** (Optional)
   - Add your custom domain in Vercel dashboard
   - Update DNS settings

### Vercel Configuration

Update `next.config.js` for Vercel:

```javascript
module.exports = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    PYTHON_API_URL: process.env.PYTHON_API_URL,
  },
}
```

---

## Railway Deployment

Deploy the Python backend to Railway.

### Prerequisites

- Railway account
- GitHub repository

### Steps

1. **Create Railway Project**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub repo
   - Select `python-backend` directory

2. **Configure Build**
   ```
   Root Directory: /python-backend
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

3. **Environment Variables**
   ```
   API_KEY=your-secret-key
   API_HOST=0.0.0.0
   API_PORT=$PORT
   REDIS_URL=redis://...
   MODEL_CHECKPOINT=datalab-to/chandra
   OCR_METHOD=hf
   LOG_LEVEL=INFO
   ```

4. **Add Redis**
   - Add Redis service in Railway
   - Copy Redis URL to `REDIS_URL` env var

5. **Deploy**
   - Railway auto-deploys on git push
   - Get your deployment URL

### Railway Configuration

Create `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Docker Deployment

Deploy using Docker on any cloud provider.

### Prerequisites

- Docker installed
- Docker Compose installed
- Server with GPU (optional, for faster processing)

### Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/bp-chandra-orc.git
   cd bp-chandra-orc
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   cp python-backend/.env.example python-backend/.env
   # Edit .env files
   ```

3. **Build Images**
   ```bash
   docker-compose build
   ```

4. **Start Services**
   ```bash
   docker-compose up -d
   ```

5. **Check Status**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

### Docker with GPU

Update `docker-compose.yml`:

```yaml
services:
  python-api:
    # ... other config
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

### SSL/TLS Configuration

Use nginx as reverse proxy:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - nextjs
      - python-api
```

---

## AWS Deployment

Deploy to Amazon Web Services.

### Architecture

- **Frontend**: AWS Amplify or S3 + CloudFront
- **Backend**: ECS Fargate or EC2
- **Redis**: ElastiCache
- **Storage**: S3
- **Load Balancer**: ALB

### Steps

#### 1. ECS Deployment

```bash
# Install AWS CLI
aws configure

# Create ECR repositories
aws ecr create-repository --repository-name chandra-nextjs
aws ecr create-repository --repository-name chandra-python

# Build and push images
docker build -f Dockerfile.nextjs -t chandra-nextjs .
docker build -f Dockerfile.python -t chandra-python .

# Tag and push
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker tag chandra-nextjs:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/chandra-nextjs:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/chandra-nextjs:latest
```

#### 2. Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name chandra-cluster
```

#### 3. Create Task Definitions

See `aws-task-definition.json` for example.

#### 4. Create Services

```bash
aws ecs create-service \
  --cluster chandra-cluster \
  --service-name chandra-service \
  --task-definition chandra-task \
  --desired-count 2 \
  --launch-type FARGATE
```

---

## Google Cloud Deployment

Deploy to Google Cloud Platform.

### Architecture

- **Frontend**: Cloud Run or App Engine
- **Backend**: Cloud Run with GPU
- **Redis**: Memorystore
- **Storage**: Cloud Storage

### Steps

1. **Install gcloud CLI**
   ```bash
   gcloud init
   ```

2. **Build Images**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/chandra-nextjs -f Dockerfile.nextjs
   gcloud builds submit --tag gcr.io/PROJECT_ID/chandra-python -f Dockerfile.python
   ```

3. **Deploy to Cloud Run**
   ```bash
   # Deploy Python backend
   gcloud run deploy chandra-api \
     --image gcr.io/PROJECT_ID/chandra-python \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   
   # Deploy Next.js frontend
   gcloud run deploy chandra-web \
     --image gcr.io/PROJECT_ID/chandra-nextjs \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

4. **Configure Redis**
   ```bash
   gcloud redis instances create chandra-redis \
     --size=1 \
     --region=us-central1
   ```

---

## Configuration

### Production Checklist

- [ ] Set strong API keys
- [ ] Configure CORS properly
- [ ] Enable HTTPS/TLS
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Set up logging
- [ ] Configure rate limiting
- [ ] Set up alerts
- [ ] Configure auto-scaling
- [ ] Test disaster recovery

### Security Best Practices

1. **API Keys**
   - Use environment variables
   - Never commit to git
   - Rotate regularly
   - Use different keys per environment

2. **Network Security**
   - Use VPC/private networks
   - Configure security groups
   - Enable firewall rules
   - Use SSL/TLS everywhere

3. **Data Security**
   - Encrypt data at rest
   - Encrypt data in transit
   - Implement access controls
   - Regular security audits

---

## Monitoring

### Logging

**Frontend (Next.js)**
- Vercel Analytics
- Sentry for error tracking
- Custom logging to CloudWatch/Stackdriver

**Backend (Python)**
- Structured logging with loguru
- Log aggregation (ELK, Datadog, etc.)
- Error tracking (Sentry, Rollbar)

### Metrics

Monitor these key metrics:
- Request rate
- Error rate
- Response time
- Queue depth
- CPU/Memory usage
- GPU utilization

### Alerts

Set up alerts for:
- High error rate (> 5%)
- Slow response time (> 10s)
- High queue depth
- Service downtime
- Resource exhaustion

### Example Monitoring Stack

```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## Scaling

### Horizontal Scaling

**Backend**
```bash
# Docker Compose
docker-compose up -d --scale python-api=3

# Kubernetes
kubectl scale deployment chandra-api --replicas=5
```

**Frontend**
- Vercel auto-scales
- Or configure auto-scaling in cloud provider

### Vertical Scaling

Adjust resource limits:

```yaml
services:
  python-api:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 16G
```

---

## Backup and Recovery

### Database Backups

```bash
# Redis backup
redis-cli BGSAVE

# Automated backups
aws elasticache create-snapshot \
  --snapshot-name chandra-backup-$(date +%Y%m%d) \
  --cache-cluster-id chandra-redis
```

### Application Backups

- Regular git commits
- Tagged releases
- Container image backups
- Configuration backups

---

## Troubleshooting

### Common Issues

1. **Out of Memory**
   - Increase container memory
   - Reduce batch size
   - Enable swap

2. **Slow Processing**
   - Check GPU availability
   - Verify model loaded correctly
   - Check network latency

3. **Connection Errors**
   - Verify network configuration
   - Check firewall rules
   - Validate credentials

### Debug Mode

Enable debug logging:

```env
# Frontend
LOG_LEVEL=debug
NODE_ENV=development

# Backend
DEBUG=true
LOG_LEVEL=DEBUG
```

---

## Support

For deployment issues:
- Check logs: `docker-compose logs`
- Review configuration
- Check resource usage
- Consult documentation

---

**Need help? Open an issue on GitHub!**

