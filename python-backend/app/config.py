"""
Configuration management for the Python backend service.
Uses pydantic-settings for validation and type safety.
"""
from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with validation"""
    
    # API Configuration
    api_key: Optional[str] = Field(default=None, description="API key for authentication")
    api_host: str = Field(default="0.0.0.0", description="Host to bind the API to")
    api_port: int = Field(default=8001, description="Port to bind the API to")
    debug: bool = Field(default=False, description="Enable debug mode")
    
    # Storage Configuration
    upload_dir: str = Field(default="./uploads", description="Directory for uploaded files")
    output_dir: str = Field(default="./outputs", description="Directory for OCR outputs")
    temp_dir: str = Field(default="./temp", description="Directory for temporary files")
    
    # OCR Configuration
    model_checkpoint: str = Field(
        default="datalab-to/chandra",
        description="Hugging Face model checkpoint"
    )
    max_output_tokens: int = Field(
        default=8192,
        ge=1024,
        le=32768,
        description="Maximum output tokens"
    )
    ocr_method: str = Field(
        default="hf",
        description="OCR method: 'hf' or 'vllm'"
    )
    
    # vLLM Configuration (if using vLLM)
    vllm_api_base: str = Field(
        default="http://localhost:8000/v1",
        description="vLLM server API base URL"
    )
    vllm_model_name: str = Field(
        default="chandra",
        description="vLLM model name"
    )
    
    # Redis Configuration (for job queue)
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL"
    )
    
    # Logging Configuration
    log_level: str = Field(default="INFO", description="Logging level")
    log_file: str = Field(default="logs/app.log", description="Log file path")
    
    # CORS Configuration
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        description="Allowed CORS origins"
    )
    
    # File Upload Limits
    max_file_size: int = Field(
        default=52428800,  # 50MB
        description="Maximum file size in bytes"
    )
    allowed_file_types: list[str] = Field(
        default=["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"],
        description="Allowed file MIME types"
    )
    
    @validator("upload_dir", "output_dir", "temp_dir")
    def create_directories(cls, v):
        """Ensure directories exist"""
        os.makedirs(v, exist_ok=True)
        return v
    
    @validator("log_file")
    def create_log_directory(cls, v):
        """Ensure log directory exists"""
        log_dir = os.path.dirname(v)
        if log_dir:
            os.makedirs(log_dir, exist_ok=True)
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()


def assert_config(condition: bool, message: str, **kwargs):
    """Configuration assertion helper"""
    if not condition:
        from loguru import logger
        logger.error(f"Configuration assertion failed: {message}", **kwargs)
        raise ValueError(f"Configuration error: {message}")


# Validate critical configuration
assert_config(
    settings.max_file_size > 0,
    "max_file_size must be positive",
    max_file_size=settings.max_file_size
)

assert_config(
    settings.max_output_tokens >= 1024,
    "max_output_tokens must be at least 1024",
    max_output_tokens=settings.max_output_tokens
)

assert_config(
    settings.ocr_method in ["hf", "vllm"],
    "ocr_method must be either 'hf' or 'vllm'",
    ocr_method=settings.ocr_method
)

