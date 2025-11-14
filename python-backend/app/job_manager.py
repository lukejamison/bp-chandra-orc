"""
Job management system for tracking OCR processing jobs.
Uses Redis for distributed job tracking.
"""
import json
import uuid
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

import redis.asyncio as redis
from loguru import logger

from app.config import settings
from app.logger import log_assert
from app.models import Job, JobStatus, OCRResult


class JobManager:
    """Manages OCR processing jobs with Redis backend"""
    
    def __init__(self):
        """Initialize job manager"""
        self.redis_url = settings.redis_url
        self.redis_client: Optional[redis.Redis] = None
        self.job_ttl = 86400  # 24 hours
        
        logger.info("Initializing job manager", redis_url=self.redis_url)
    
    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis_client = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            
            # Test connection
            await self.redis_client.ping()
            
            log_assert(
                self.redis_client is not None,
                "Redis connection failed"
            )
            
            logger.success("Connected to Redis")
            
        except Exception as e:
            logger.error("Failed to connect to Redis", error=str(e))
            # Fall back to in-memory storage
            self._jobs: Dict[str, Job] = {}
            logger.warning("Using in-memory job storage as fallback")
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Disconnected from Redis")
    
    async def create_job(self, request_id: Optional[str] = None) -> str:
        """
        Create a new job.
        
        Args:
            request_id: Optional request ID for tracking
            
        Returns:
            Job ID
        """
        job_id = str(uuid.uuid4())
        
        job = Job(
            job_id=job_id,
            status=JobStatus.PENDING,
            request_id=request_id,
        )
        
        await self._save_job(job)
        
        logger.info("Job created", job_id=job_id, request_id=request_id)
        return job_id
    
    async def get_job(self, job_id: str) -> Optional[Job]:
        """
        Get job by ID.
        
        Args:
            job_id: Job ID
            
        Returns:
            Job object or None if not found
        """
        log_assert(
            job_id and len(job_id) > 0,
            "Job ID is required",
            job_id=job_id
        )
        
        if self.redis_client:
            key = f"job:{job_id}"
            data = await self.redis_client.get(key)
            
            if data:
                job_dict = json.loads(data)
                return Job(**job_dict)
            return None
        else:
            # In-memory fallback
            return self._jobs.get(job_id)
    
    async def update_job_status(
        self,
        job_id: str,
        status: JobStatus,
        result: Optional[OCRResult] = None,
        error: Optional[str] = None
    ):
        """
        Update job status.
        
        Args:
            job_id: Job ID
            status: New status
            result: OCR result if completed
            error: Error message if failed
        """
        log_assert(
            job_id and len(job_id) > 0,
            "Job ID is required",
            job_id=job_id
        )
        
        job = await self.get_job(job_id)
        
        if not job:
            logger.error("Job not found", job_id=job_id)
            raise ValueError(f"Job {job_id} not found")
        
        job.status = status
        job.updated_at = datetime.utcnow()
        
        if result:
            job.result = result
        
        if error:
            job.error = error
        
        await self._save_job(job)
        
        logger.info(
            "Job status updated",
            job_id=job_id,
            status=status.value,
            has_result=result is not None,
            has_error=error is not None
        )
    
    async def _save_job(self, job: Job):
        """Save job to storage"""
        if self.redis_client:
            key = f"job:{job.job_id}"
            # Convert to dict with proper serialization
            job_dict = job.dict()
            # Convert datetime objects to ISO format strings
            job_dict["created_at"] = job_dict["created_at"].isoformat()
            job_dict["updated_at"] = job_dict["updated_at"].isoformat()
            
            data = json.dumps(job_dict)
            await self.redis_client.setex(
                key,
                self.job_ttl,
                data
            )
        else:
            # In-memory fallback
            self._jobs[job.job_id] = job
    
    async def delete_job(self, job_id: str):
        """
        Delete job from storage.
        
        Args:
            job_id: Job ID
        """
        log_assert(
            job_id and len(job_id) > 0,
            "Job ID is required",
            job_id=job_id
        )
        
        if self.redis_client:
            key = f"job:{job_id}"
            await self.redis_client.delete(key)
        else:
            self._jobs.pop(job_id, None)
        
        logger.info("Job deleted", job_id=job_id)
    
    async def cleanup_old_jobs(self, days: int = 7):
        """
        Clean up jobs older than specified days.
        
        Args:
            days: Number of days to keep jobs
        """
        logger.info("Cleaning up old jobs", days=days)
        
        if not self.redis_client:
            # In-memory cleanup
            cutoff = datetime.utcnow() - timedelta(days=days)
            jobs_to_delete = [
                job_id for job_id, job in self._jobs.items()
                if job.created_at < cutoff
            ]
            for job_id in jobs_to_delete:
                del self._jobs[job_id]
            
            logger.info("Cleanup completed", deleted_count=len(jobs_to_delete))


# Global job manager instance
job_manager = JobManager()

