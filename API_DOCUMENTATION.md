# API Documentation

Complete API documentation for the Chandra OCR backend service.

## Base URL

```
http://localhost:8001
```

For production: `https://your-domain.com`

## Authentication

All API endpoints (except `/health`) require an API key for authentication.

**Header:**
```
X-API-Key: your-secret-api-key-here
```

## Endpoints

### 1. Health Check

Check the health status of the API and its dependencies.

**Endpoint:** `GET /health`

**Authentication:** Not required

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000000",
  "version": "0.1.0",
  "services": {
    "api": "healthy",
    "redis": "healthy",
    "ocr": "healthy"
  }
}
```

**Status Codes:**
- `200 OK` - All services healthy
- `503 Service Unavailable` - One or more services unhealthy

---

### 2. Process Document

Upload and process a document with OCR.

**Endpoint:** `POST /api/v1/ocr/process`

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| file | File | Yes | Document file to process (PDF, PNG, JPEG, WEBP) |
| options | JSON String | No | OCR processing options (see below) |
| requestId | String | No | Custom request ID for tracking |

**OCR Options:**
```json
{
  "page_range": "1-5,7,9-12",
  "max_output_tokens": 8192,
  "include_images": true,
  "include_headers_footers": false,
  "output_format": "markdown"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8001/api/v1/ocr/process \
  -H "X-API-Key: your-secret-api-key-here" \
  -F "file=@document.pdf" \
  -F 'options={"output_format":"markdown","include_images":true}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "created_at": "2024-01-01T00:00:00.000000",
    "updated_at": "2024-01-01T00:00:00.000000",
    "request_id": "custom-request-id"
  },
  "timestamp": "2024-01-01T00:00:00.000000"
}
```

**Status Codes:**
- `200 OK` - Job created successfully
- `400 Bad Request` - Invalid file or options
- `401 Unauthorized` - Invalid API key
- `413 Payload Too Large` - File exceeds size limit
- `500 Internal Server Error` - Processing error

---

### 3. Get Job Status

Check the current status of a processing job.

**Endpoint:** `GET /api/v1/ocr/status/{job_id}`

**Authentication:** Required

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| job_id | String | Yes | Job ID from process endpoint |

**Example Request:**
```bash
curl http://localhost:8001/api/v1/ocr/status/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: your-secret-api-key-here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "created_at": "2024-01-01T00:00:00.000000",
    "updated_at": "2024-01-01T00:00:05.000000",
    "request_id": "custom-request-id",
    "result": {
      "content": "[12345 characters]",
      "metadata": {...},
      "images": [...]
    }
  },
  "timestamp": "2024-01-01T00:00:05.000000"
}
```

**Job Statuses:**
- `pending` - Job is queued
- `processing` - OCR is running
- `completed` - Processing finished successfully
- `failed` - Processing encountered an error

**Status Codes:**
- `200 OK` - Job status retrieved
- `401 Unauthorized` - Invalid API key
- `404 Not Found` - Job not found
- `500 Internal Server Error` - Server error

---

### 4. Get Job Result

Retrieve the complete result of a completed job.

**Endpoint:** `GET /api/v1/ocr/result/{job_id}`

**Authentication:** Required

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| job_id | String | Yes | Job ID from process endpoint |

**Example Request:**
```bash
curl http://localhost:8001/api/v1/ocr/result/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: your-secret-api-key-here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "result": {
      "content": "# Page 1\n\nExtracted text content here...",
      "metadata": {
        "job_id": "550e8400-e29b-41d4-a716-446655440000",
        "file_type": "pdf",
        "total_pages": 10,
        "processed_pages": 5,
        "pages": [1, 2, 3, 4, 5]
      },
      "images": []
    },
    "created_at": "2024-01-01T00:00:00.000000",
    "updated_at": "2024-01-01T00:00:05.000000"
  },
  "timestamp": "2024-01-01T00:00:05.000000"
}
```

**Status Codes:**
- `200 OK` - Result retrieved successfully
- `400 Bad Request` - Job not completed yet
- `401 Unauthorized` - Invalid API key
- `404 Not Found` - Job not found
- `500 Internal Server Error` - Server error

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00.000000"
}
```

**Common Error Codes:**

| Code | Description |
|------|-------------|
| `INVALID_FILE` | File validation failed |
| `INVALID_OPTIONS` | OCR options validation failed |
| `PROCESSING_ERROR` | OCR processing failed |
| `JOB_NOT_FOUND` | Job ID not found |
| `JOB_NOT_COMPLETED` | Job not yet completed |
| `STATUS_CHECK_ERROR` | Failed to check status |
| `RESULT_FETCH_ERROR` | Failed to fetch result |
| `INTERNAL_ERROR` | Internal server error |

---

## Rate Limiting

Currently no rate limiting is implemented. For production use, consider implementing rate limiting based on:
- API key
- IP address
- Request count per time window

---

## Best Practices

### 1. Job Polling

When polling for job status:
- Poll every 5 seconds
- Implement exponential backoff
- Set a maximum timeout (e.g., 5 minutes)

```javascript
async function pollJobStatus(jobId) {
  const maxAttempts = 60;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const response = await fetch(`/api/v1/ocr/status/${jobId}`);
    const data = await response.json();
    
    if (data.data.status === 'completed') {
      return data;
    }
    
    if (data.data.status === 'failed') {
      throw new Error(data.data.error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }
  
  throw new Error('Timeout waiting for job completion');
}
```

### 2. Error Handling

Always handle errors gracefully:

```javascript
try {
  const response = await fetch('/api/v1/ocr/process', {
    method: 'POST',
    headers: {
      'X-API-Key': 'your-api-key',
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.error.message);
    throw new Error(error.error.message);
  }
  
  const data = await response.json();
  // Handle success
} catch (error) {
  // Handle error
  console.error('Request failed:', error);
}
```

### 3. File Size Limits

- Maximum file size: 50MB (configurable)
- Supported formats: PDF, PNG, JPEG, JPG, WEBP
- For larger files, consider splitting into smaller chunks

### 4. API Key Security

- Never expose API keys in client-side code
- Use environment variables
- Rotate keys regularly
- Use different keys for dev/staging/production

---

## Code Examples

### Python

```python
import requests

# Process document
def process_document(file_path, api_key):
    url = "http://localhost:8001/api/v1/ocr/process"
    headers = {"X-API-Key": api_key}
    
    with open(file_path, 'rb') as f:
        files = {'file': f}
        options = {
            'output_format': 'markdown',
            'include_images': True
        }
        data = {'options': json.dumps(options)}
        
        response = requests.post(url, headers=headers, files=files, data=data)
        return response.json()

# Check status
def get_job_status(job_id, api_key):
    url = f"http://localhost:8001/api/v1/ocr/status/{job_id}"
    headers = {"X-API-Key": api_key}
    
    response = requests.get(url, headers=headers)
    return response.json()
```

### JavaScript/TypeScript

```typescript
// Process document
async function processDocument(file: File, apiKey: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('options', JSON.stringify({
    output_format: 'markdown',
    include_images: true
  }));
  
  const response = await fetch('http://localhost:8001/api/v1/ocr/process', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
    },
    body: formData,
  });
  
  return await response.json();
}

// Check status
async function getJobStatus(jobId: string, apiKey: string) {
  const response = await fetch(`http://localhost:8001/api/v1/ocr/status/${jobId}`, {
    headers: {
      'X-API-Key': apiKey,
    },
  });
  
  return await response.json();
}
```

### cURL

```bash
# Process document
curl -X POST http://localhost:8001/api/v1/ocr/process \
  -H "X-API-Key: your-api-key" \
  -F "file=@document.pdf" \
  -F 'options={"output_format":"markdown"}'

# Check status
curl http://localhost:8001/api/v1/ocr/status/{job_id} \
  -H "X-API-Key: your-api-key"

# Get result
curl http://localhost:8001/api/v1/ocr/result/{job_id} \
  -H "X-API-Key: your-api-key"
```

---

## Webhook Support (Future)

Coming soon: Webhook notifications when jobs complete.

```json
{
  "event": "job.completed",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "timestamp": "2024-01-01T00:00:05.000000"
}
```

---

## Interactive API Documentation

For interactive API documentation, visit:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

