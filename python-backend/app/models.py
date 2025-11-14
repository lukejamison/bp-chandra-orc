"""
Pydantic models for request/response validation.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, Literal, Dict, Any, List
from datetime import datetime
from enum import Enum


class JobStatus(str, Enum):
    """Job processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class OCROptions(BaseModel):
    """OCR processing options"""
    page_range: Optional[str] = Field(
        None,
        description="Page range (e.g., '1-5,7,9-12')"
    )
    max_output_tokens: int = Field(
        8192,
        ge=1024,
        le=32768,
        description="Maximum output tokens per page"
    )
    include_images: bool = Field(
        True,
        description="Extract and include images"
    )
    include_headers_footers: bool = Field(
        False,
        description="Include page headers and footers"
    )
    output_format: Literal["markdown", "html", "json"] = Field(
        "markdown",
        description="Output format"
    )
    
    @validator("page_range")
    def validate_page_range(cls, v):
        """Validate page range format"""
        if v is None:
            return v
        
        import re
        pattern = r"^(\d+(-\d+)?)(,\d+(-\d+)?)*$"
        if not re.match(pattern, v):
            raise ValueError("Invalid page range format. Use: 1-5,7,9-12")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "page_range": "1-5,7",
                "max_output_tokens": 8192,
                "include_images": True,
                "include_headers_footers": False,
                "output_format": "markdown"
            }
        }


class OCRResult(BaseModel):
    """OCR processing result"""
    content: str = Field(..., description="Extracted content")
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Processing metadata"
    )
    images: Optional[List[str]] = Field(
        None,
        description="Extracted image URLs/paths"
    )


class Job(BaseModel):
    """Job information"""
    job_id: str = Field(..., description="Unique job identifier")
    status: JobStatus = Field(..., description="Job processing status")
    result: Optional[OCRResult] = Field(None, description="OCR result if completed")
    error: Optional[str] = Field(None, description="Error message if failed")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = Field(None, description="Original request ID")


class APIResponse(BaseModel):
    """Standard API response wrapper"""
    success: bool = Field(..., description="Whether the request was successful")
    data: Optional[Any] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Error response"""
    success: bool = Field(False, description="Always false for errors")
    error: Dict[str, Any] = Field(..., description="Error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error": {
                    "message": "File validation failed",
                    "code": "INVALID_FILE",
                    "details": {}
                },
                "timestamp": "2024-01-01T00:00:00"
            }
        }


class HealthResponse(BaseModel):
    """Health check response"""
    status: Literal["healthy", "unhealthy", "degraded"] = Field(
        ...,
        description="Service health status"
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = Field(default="0.1.0", description="API version")
    services: Dict[str, str] = Field(
        default_factory=dict,
        description="Status of dependent services"
    )

