# 🖥️ Server Deployment Guide

Deploy BP Chandra OCR to your own Linux server with Docker.

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Docker & Docker Compose installed
- At least 8GB RAM (16GB recommended for better performance)
- At least 10GB free disk space

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/bp-chandra-orc.git
cd bp-chandra-orc
```

### 2. Run the Deploy Script

```bash
chmod +x deploy-to-server.sh
./deploy-to-server.sh
```

### 3. Configure Your API Key

```bash
nano .env
# Change API_KEY to a secure random string
```

### 4. Restart Services

```bash
docker-compose restart
```

## Manual Deployment

If you prefer manual control:

### 1. Create .env File

```bash
cat > .env << EOF
API_KEY=$(openssl rand -hex 32)
REDIS_URL=redis://redis:6379/0
PYTHON_API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:3000
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
NODE_ENV=production
EOF
```

### 2. Build and Start

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

## Accessing Your Application

Once deployed:

- **Frontend**: http://YOUR_SERVER_IP:3000
- **API**: http://YOUR_SERVER_IP:8000
- **API Docs**: http://YOUR_SERVER_IP:8000/docs

## Configuration

### Port Mapping

Edit `docker-compose.yml` to change ports:

```yaml
services:
  nextjs:
    ports:
      - "3000:3000"  # Change left number to expose on different port
  
  python-backend:
    ports:
      - "8000:8000"  # Change left number to expose on different port
```

### Environment Variables

Key environment variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `API_KEY` | API authentication key | (required) |
| `REDIS_URL` | Redis connection URL | redis://redis:6379/0 |
| `OPENAI_API_KEY` | OpenAI API key (optional) | - |
| `PYTHON_API_URL` | Backend URL for frontend | http://localhost:8000 |

## Management Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f python-backend
docker-compose logs -f nextjs
docker-compose logs -f redis
```

### Restart Services

```bash
# All services
docker-compose restart

# Specific service
docker-compose restart python-backend
```

### Stop Services

```bash
docker-compose down
```

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

## Nginx Reverse Proxy (Optional)

For production with a domain name:

### Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

### Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/bp-chandra-orc
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api/python {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for OCR processing
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Increase max upload size for documents
    client_max_body_size 50M;
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/bp-chandra-orc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Add SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Monitoring

### Check Container Status

```bash
docker-compose ps
```

### Check Resource Usage

```bash
docker stats
```

### Health Checks

```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend
curl http://localhost:3000
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs python-backend

# Check if ports are in use
sudo netstat -tulpn | grep -E '3000|8000|6379'
```

### Out of Memory

Increase Docker memory limit or add swap:

```bash
# Add 4GB swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Build Fails

```bash
# Clean Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
```

## Backup

### Backup Redis Data

```bash
docker-compose exec redis redis-cli SAVE
docker cp $(docker-compose ps -q redis):/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

### Backup Configuration

```bash
tar -czf backup-$(date +%Y%m%d).tar.gz .env docker-compose.yml
```

## Performance Optimization

### For Production

1. **Use GPU** (if available):
   ```yaml
   # In docker-compose.yml
   python-backend:
     deploy:
       resources:
         reservations:
           devices:
             - driver: nvidia
               count: 1
               capabilities: [gpu]
   ```

2. **Increase Worker Processes**:
   ```yaml
   # In docker-compose.yml
   python-backend:
     command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

3. **Add Redis Persistence**:
   ```yaml
   # In docker-compose.yml
   redis:
     volumes:
       - ./redis-data:/data
     command: redis-server --appendonly yes
   ```

## Security

1. **Change default API key** in `.env`
2. **Use Nginx reverse proxy** with SSL
3. **Set up firewall**:
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```
4. **Keep Docker updated**:
   ```bash
   sudo apt update
   sudo apt upgrade docker-ce docker-ce-cli containerd.io
   ```

## Support

For issues, check:
1. Docker logs: `docker-compose logs -f`
2. System resources: `docker stats`
3. Health endpoints: `/health` and `/api/health`

