"""
FastAPI application for Chandra OCR backend service.
"""
import os
import uuid
import tempfile
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from app.config import settings
from app.logger import log_assert
from app.models import (
    APIResponse,
    ErrorResponse,
    HealthResponse,
    OCROptions,
    JobStatus,
)
from app.ocr_service import ocr_service
from app.job_manager import job_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting application")
    
    # Connect to Redis
    await job_manager.connect()
    
    logger.success("Application started successfully")
    
    yield
    
    # Cleanup
    logger.info("Shutting down application")
    await job_manager.disconnect()
    logger.info("Application shut down")


# Create FastAPI app
app = FastAPI(
    title="Chandra OCR API",
    description="Backend API for Chandra OCR document processing",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API Key authentication
async def verify_api_key(x_api_key: Optional[str] = Header(None)):
    """Verify API key if configured"""
    if settings.api_key and x_api_key != settings.api_key:
        logger.warning("Invalid API key", provided_key=x_api_key)
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )
    return x_api_key


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    logger.info("Health check requested")
    
    # Check Redis connection
    redis_healthy = False
    try:
        if job_manager.redis_client:
            await job_manager.redis_client.ping()
            redis_healthy = True
    except Exception as e:
        logger.warning("Redis health check failed", error=str(e))
    
    status = "healthy" if redis_healthy else "degraded"
    
    return HealthResponse(
        status=status,
        services={
            "api": "healthy",
            "redis": "healthy" if redis_healthy else "unhealthy",
            "ocr": "healthy",
        }
    )


@app.post("/api/v1/ocr/process", response_model=APIResponse)
async def process_ocr(
    file: UploadFile = File(..., description="Document file to process"),
    options: Optional[str] = Form(None, description="OCR options as JSON"),
    requestId: Optional[str] = Form(None, description="Request tracking ID"),
    api_key: str = Depends(verify_api_key),
):
    """
    Process a document with OCR.
    
    This endpoint accepts a file upload and processes it asynchronously.
    Returns a job ID for tracking the processing status.
    """
    request_id = requestId or str(uuid.uuid4())
    start_time = logger.bind(request_id=request_id)
    
    logger.info(
        "OCR process request received",
        request_id=request_id,
        filename=file.filename,
        content_type=file.content_type,
    )
    
    try:
        # Validate file type
        log_assert(
            file.content_type in settings.allowed_file_types,
            f"Invalid file type: {file.content_type}",
            content_type=file.content_type,
            allowed_types=settings.allowed_file_types
        )
        
        # Parse options
        ocr_options = OCROptions()
        if options:
            import json
            options_dict = json.loads(options)
            ocr_options = OCROptions(**options_dict)
        
        logger.info("Options parsed", options=ocr_options.dict(), request_id=request_id)
        
        # Create job
        job_id = await job_manager.create_job(request_id=request_id)
        
        # Save uploaded file
        file_ext = os.path.splitext(file.filename or "document")[1]
        temp_file_path = os.path.join(
            settings.upload_dir,
            f"{job_id}{file_ext}"
        )
        
        logger.info("Saving uploaded file", path=temp_file_path, request_id=request_id)
        
        # Read and save file
        content = await file.read()
        
        log_assert(
            len(content) <= settings.max_file_size,
            f"File size exceeds limit: {len(content)} > {settings.max_file_size}",
            file_size=len(content),
            max_size=settings.max_file_size
        )
        
        with open(temp_file_path, "wb") as f:
            f.write(content)
        
        logger.info("File saved", size=len(content), request_id=request_id)
        
        # Update job status to processing
        await job_manager.update_job_status(job_id, JobStatus.PROCESSING)
        
        # Process document (in background, but for simplicity doing it synchronously here)
        # In production, you'd use Celery or similar for true background processing
        try:
            result = await ocr_service.process_document(
                temp_file_path,
                ocr_options,
                request_id=request_id
            )
            
            # Update job with result
            await job_manager.update_job_status(
                job_id,
                JobStatus.COMPLETED,
                result=result
            )
            
            logger.success("OCR processing completed", job_id=job_id, request_id=request_id)
            
        except Exception as e:
            logger.error("OCR processing failed", job_id=job_id, error=str(e))
            await job_manager.update_job_status(
                job_id,
                JobStatus.FAILED,
                error=str(e)
            )
        
        finally:
            # Cleanup temp file
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.warning("Failed to delete temp file", path=temp_file_path, error=str(e))
        
        # Return job info
        job = await job_manager.get_job(job_id)
        
        return APIResponse(
            success=True,
            data=job.dict() if job else {"job_id": job_id, "status": "unknown"}
        )
        
    except Exception as e:
        logger.error("Request processing failed", request_id=request_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail={
                "message": str(e),
                "code": "PROCESSING_ERROR"
            }
        )


@app.get("/api/v1/ocr/status/{job_id}", response_model=APIResponse)
async def get_job_status(
    job_id: str,
    api_key: str = Depends(verify_api_key),
):
    """
    Get the status of an OCR processing job.
    
    Returns the current status and basic information about the job.
    For completed jobs, use the /result endpoint to get the full output.
    """
    logger.info("Job status requested", job_id=job_id)
    
    try:
        job = await job_manager.get_job(job_id)
        
        if not job:
            logger.warning("Job not found", job_id=job_id)
            raise HTTPException(
                status_code=404,
                detail={
                    "message": f"Job {job_id} not found",
                    "code": "JOB_NOT_FOUND"
                }
            )
        
        # Return job without full result content to keep response small
        job_dict = job.dict()
        if job_dict.get("result") and job_dict["result"].get("content"):
            # Include only metadata, not full content
            job_dict["result"]["content"] = f"[{len(job_dict['result']['content'])} characters]"
        
        return APIResponse(
            success=True,
            data=job_dict
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to retrieve job status", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail={
                "message": str(e),
                "code": "STATUS_CHECK_ERROR"
            }
        )


@app.get("/api/v1/ocr/result/{job_id}", response_model=APIResponse)
async def get_job_result(
    job_id: str,
    api_key: str = Depends(verify_api_key),
):
    """
    Get the full result of a completed OCR job.
    
    Returns the complete OCR output including content, metadata, and images.
    """
    logger.info("Job result requested", job_id=job_id)
    
    try:
        job = await job_manager.get_job(job_id)
        
        if not job:
            logger.warning("Job not found", job_id=job_id)
            raise HTTPException(
                status_code=404,
                detail={
                    "message": f"Job {job_id} not found",
                    "code": "JOB_NOT_FOUND"
                }
            )
        
        if job.status != JobStatus.COMPLETED:
            logger.warning("Job not completed", job_id=job_id, status=job.status.value)
            raise HTTPException(
                status_code=400,
                detail={
                    "message": f"Job is not completed (status: {job.status.value})",
                    "code": "JOB_NOT_COMPLETED"
                }
            )
        
        return APIResponse(
            success=True,
            data=job.dict()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to retrieve job result", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail={
                "message": str(e),
                "code": "RESULT_FETCH_ERROR"
            }
        )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail if isinstance(exc.detail, dict) else {"message": str(exc.detail)}
        ).dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error={
                "message": "Internal server error",
                "code": "INTERNAL_ERROR"
            }
        ).dict()
    )


if __name__ == "__main__":
    import uvicorn
    
    logger.info(
        "Starting server",
        host=settings.api_host,
        port=settings.api_port,
        debug=settings.debug
    )
    
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )

