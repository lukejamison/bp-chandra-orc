# BP Chandra OCR

A production-ready Next.js application integrated with [Chandra OCR](https://github.com/datalab-to/chandra) for document processing. This application provides both a web interface and REST API endpoints for converting documents (PDFs, images) into structured text with advanced OCR capabilities.

## 🌟 Features

- **Modern Web UI**: Beautiful, responsive interface for document upload and processing
- **REST API**: Full-featured API endpoints for programmatic access
- **Multiple Output Formats**: Support for Markdown, HTML, and JSON
- **Advanced OCR**: Handles complex tables, forms, handwriting, and multi-column layouts
- **Real-time Processing**: Async job processing with status tracking
- **Comprehensive Logging**: Structured logging with winston (Node.js) and loguru (Python)
- **Production Ready**: Docker support, error handling, and validation
- **Vercel Compatible**: Ready to deploy on Vercel platform

## 📋 Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- Docker and Docker Compose (for containerized deployment)
- CUDA-capable GPU (optional, for faster processing)
- Redis (for job queue management)

## 🚀 Quick Start

### Local Development (Without Docker)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bp-chandra-orc.git
   cd bp-chandra-orc
   ```

2. **Set up environment variables**
   ```bash
   # Copy environment templates
   cp .env.example .env
   cp python-backend/.env.example python-backend/.env
   
   # Edit .env files with your configuration
   ```

3. **Install dependencies**
   ```bash
   # Install Node.js dependencies
   npm install
   
   # Install Python dependencies
   cd python-backend
   pip install -r requirements.txt
   cd ..
   ```

4. **Start Redis** (required for job queue)
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

5. **Start Python backend**
   ```bash
   cd python-backend
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```

6. **Start Next.js frontend** (in a new terminal)
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Web UI: http://localhost:3000
   - Python API: http://localhost:8001
   - API Docs: http://localhost:8001/docs

### Docker Development

```bash
# Start all services with docker-compose
docker-compose -f docker-compose.dev.yml up

# Access the application
# Web UI: http://localhost:3000
# Python API: http://localhost:8001
```

### Docker Production

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📁 Project Structure

```
bp-chandra-orc/
├── src/                          # Next.js application
│   ├── components/               # React components
│   │   ├── FileUpload.tsx       # File upload with drag & drop
│   │   ├── OCROptions.tsx       # OCR configuration form
│   │   ├── StatusIndicator.tsx  # Job status display
│   │   └── ResultDisplay.tsx    # OCR results viewer
│   ├── lib/                      # Utility libraries
│   │   ├── logger.ts            # Winston logging setup
│   │   ├── validation.ts        # Zod schemas & validation
│   │   ├── api-client.ts        # Python API client
│   │   └── utils.ts             # Helper functions
│   ├── pages/                    # Next.js pages
│   │   ├── api/                 # API routes
│   │   │   ├── health.ts        # Health check endpoint
│   │   │   └── ocr/             # OCR API endpoints
│   │   ├── _app.tsx             # App wrapper
│   │   └── index.tsx            # Main page
│   └── styles/                   # Global styles
├── python-backend/               # Python FastAPI backend
│   ├── app/
│   │   ├── config.py            # Configuration management
│   │   ├── logger.py            # Loguru logging setup
│   │   ├── models.py            # Pydantic models
│   │   ├── ocr_service.py       # Chandra OCR integration
│   │   ├── job_manager.py       # Redis job management
│   │   └── main.py              # FastAPI application
│   └── requirements.txt          # Python dependencies
├── docker-compose.yml            # Production Docker setup
├── docker-compose.dev.yml        # Development Docker setup
├── Dockerfile.nextjs             # Next.js Dockerfile
├── Dockerfile.python             # Python Dockerfile
└── README.md                     # This file
```

## 🔧 Configuration

### Environment Variables

#### Next.js Frontend (`.env`)

```env
# Python API Configuration
PYTHON_API_URL=http://localhost:8001
PYTHON_API_KEY=your-secret-api-key-here

# File Upload Configuration
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=application/pdf,image/png,image/jpeg,image/jpg,image/webp

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

#### Python Backend (`python-backend/.env`)

```env
# API Configuration
API_KEY=your-secret-api-key-here
API_HOST=0.0.0.0
API_PORT=8001
DEBUG=false

# OCR Configuration
MODEL_CHECKPOINT=datalab-to/chandra
MAX_OUTPUT_TOKENS=8192
OCR_METHOD=hf

# Redis
REDIS_URL=redis://localhost:6379/0

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
```

## 📡 API Documentation

### REST API Endpoints

#### Health Check
```bash
GET /health
```

#### Process Document
```bash
POST /api/v1/ocr/process
Content-Type: multipart/form-data

Parameters:
- file: File (required)
- options: JSON string with OCR options
- requestId: Request tracking ID (optional)
```

#### Get Job Status
```bash
GET /api/v1/ocr/status/{job_id}
```

#### Get Job Result
```bash
GET /api/v1/ocr/result/{job_id}
```

### Example API Usage

```bash
# Upload and process a document
curl -X POST http://localhost:8001/api/v1/ocr/process \
  -H "X-API-Key: your-secret-api-key-here" \
  -F "file=@document.pdf" \
  -F 'options={"output_format":"markdown","include_images":true}'

# Check job status
curl http://localhost:8001/api/v1/ocr/status/{job_id} \
  -H "X-API-Key: your-secret-api-key-here"

# Get result
curl http://localhost:8001/api/v1/ocr/result/{job_id} \
  -H "X-API-Key: your-secret-api-key-here"
```

## 🎨 Web Interface Features

- **Drag & Drop Upload**: Easy file upload with visual feedback
- **OCR Options**: Configure page range, output format, token limits
- **Real-time Status**: Live updates on processing progress
- **Result Viewer**: Tabbed interface for content, metadata, and images
- **Download Results**: Export OCR results in various formats
- **Dark Mode Support**: Automatic theme detection

## 🔍 Logging & Debugging

### Frontend Logging

Logs are written to:
- Console (development)
- `logs/error.log` (errors only)
- `logs/combined.log` (all logs)

### Backend Logging

Logs are written to:
- Console (structured, colored output)
- `logs/app.log` (all logs, rotated)
- `logs/app_error.log` (errors only, with stack traces)

### Assert Statements

The application includes comprehensive assert statements for debugging:

```typescript
// TypeScript
assert(condition, "Error message", { metadata });
debugAssert(condition, "Debug message", { metadata });
```

```python
# Python
log_assert(condition, "Error message", metadata=value)
debug_assert(condition, "Debug message", metadata=value)
```

## 🚢 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Configure Environment**
   - Add environment variables in Vercel dashboard
   - Deploy Python backend separately (Railway, Render, etc.)

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Docker Deployment

```bash
# Production deployment
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale python-api=3
```

## 🧪 Testing

```bash
# Run tests (to be implemented)
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📊 Performance

- **Average OCR Time**: 2-5 seconds per page (with GPU)
- **Supported File Size**: Up to 50MB per upload
- **Concurrent Jobs**: Configurable with Redis job queue
- **Output Token Limit**: 1K - 32K tokens per page

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the Apache 2.0 License. The Chandra OCR model uses a modified OpenRAIL-M license. See the [Chandra repository](https://github.com/datalab-to/chandra) for details.

## 🙏 Acknowledgments

- [Chandra OCR](https://github.com/datalab-to/chandra) by Datalab
- [Next.js](https://nextjs.org/) by Vercel
- [FastAPI](https://fastapi.tiangolo.com/) by Sebastián Ramírez
- [Hugging Face Transformers](https://huggingface.co/docs/transformers)

## 📧 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/bp-chandra-orc/issues)
- Email: your.email@example.com

## 🔗 Links

- [Chandra OCR Repository](https://github.com/datalab-to/chandra)
- [Chandra Playground](https://www.datalab.to)
- [API Documentation](http://localhost:8001/docs)

---

**Built with ❤️ using Chandra OCR, Next.js, and FastAPI**

