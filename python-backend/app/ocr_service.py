"""
OCR service using Chandra for document processing.
"""
import os
import uuid
import json
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime

from loguru import logger
from PIL import Image
import aiofiles

from app.config import settings
from app.logger import log_assert, debug_assert
from app.models import OCROptions, OCRResult, JobStatus


class ChandraOCRService:
    """Service for processing documents with Chandra OCR"""
    
    def __init__(self):
        """Initialize OCR service"""
        self.model_checkpoint = settings.model_checkpoint
        self.method = settings.ocr_method
        
        logger.info(
            "Initializing Chandra OCR service",
            model=self.model_checkpoint,
            method=self.method
        )
        
        # Import Chandra based on method
        if self.method == "hf":
            self._init_huggingface()
        elif self.method == "vllm":
            self._init_vllm()
        else:
            raise ValueError(f"Invalid OCR method: {self.method}")
    
    def _init_huggingface(self):
        """Initialize Hugging Face transformers"""
        try:
            from transformers import AutoProcessor, AutoModelForVision2Seq
            import torch
            
            logger.info("Loading Hugging Face model", model=self.model_checkpoint)
            
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info("Using device", device=self.device)
            
            self.processor = AutoProcessor.from_pretrained(
                self.model_checkpoint,
                trust_remote_code=True
            )
            self.model = AutoModelForVision2Seq.from_pretrained(
                self.model_checkpoint,
                trust_remote_code=True,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            ).to(self.device)
            
            log_assert(
                self.model is not None,
                "Failed to load model",
                checkpoint=self.model_checkpoint
            )
            
            logger.success("Hugging Face model loaded successfully")
            
        except Exception as e:
            logger.error("Failed to initialize Hugging Face model", error=str(e))
            raise
    
    def _init_vllm(self):
        """Initialize vLLM client"""
        try:
            from openai import OpenAI
            
            logger.info("Initializing vLLM client", api_base=settings.vllm_api_base)
            
            self.vllm_client = OpenAI(
                api_key="EMPTY",
                base_url=settings.vllm_api_base,
            )
            
            log_assert(
                self.vllm_client is not None,
                "Failed to initialize vLLM client"
            )
            
            logger.success("vLLM client initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize vLLM client", error=str(e))
            raise
    
    async def process_document(
        self,
        file_path: str,
        options: OCROptions,
        request_id: Optional[str] = None
    ) -> OCRResult:
        """
        Process a document using Chandra OCR.
        
        Args:
            file_path: Path to the document file
            options: OCR processing options
            request_id: Optional request ID for tracking
            
        Returns:
            OCRResult with extracted content
        """
        job_id = str(uuid.uuid4())
        start_time = datetime.utcnow()
        
        logger.info(
            "Starting OCR processing",
            job_id=job_id,
            request_id=request_id,
            file=file_path,
            options=options.dict()
        )
        
        try:
            # Validate file exists
            log_assert(
                os.path.exists(file_path),
                "File not found",
                file_path=file_path
            )
            
            # Detect file type
            file_ext = Path(file_path).suffix.lower()
            is_pdf = file_ext == ".pdf"
            
            logger.info("Processing file", type="PDF" if is_pdf else "Image", ext=file_ext)
            
            # Process based on file type
            if is_pdf:
                result = await self._process_pdf(file_path, options, job_id)
            else:
                result = await self._process_image(file_path, options, job_id)
            
            duration = (datetime.utcnow() - start_time).total_seconds()
            
            logger.success(
                "OCR processing completed",
                job_id=job_id,
                duration_seconds=duration,
                content_length=len(result.content)
            )
            
            return result
            
        except Exception as e:
            duration = (datetime.utcnow() - start_time).total_seconds()
            logger.error(
                "OCR processing failed",
                job_id=job_id,
                error=str(e),
                duration_seconds=duration
            )
            raise
    
    async def _process_image(
        self,
        image_path: str,
        options: OCROptions,
        job_id: str
    ) -> OCRResult:
        """Process a single image"""
        logger.info("Processing image", path=image_path, job_id=job_id)
        
        try:
            # Load image
            image = Image.open(image_path).convert("RGB")
            
            log_assert(
                image is not None,
                "Failed to load image",
                path=image_path
            )
            
            # Process with appropriate method
            if self.method == "hf":
                content = await self._process_with_hf(image, options)
            else:
                content = await self._process_with_vllm(image_path, options)
            
            # Prepare result
            result = OCRResult(
                content=content,
                metadata={
                    "job_id": job_id,
                    "file_type": "image",
                    "size": image.size,
                    "format": image.format,
                    "mode": image.mode,
                },
                images=None if not options.include_images else []
            )
            
            logger.info("Image processed successfully", job_id=job_id)
            return result
            
        except Exception as e:
            logger.error("Image processing failed", job_id=job_id, error=str(e))
            raise
    
    async def _process_pdf(
        self,
        pdf_path: str,
        options: OCROptions,
        job_id: str
    ) -> OCRResult:
        """Process a PDF document"""
        logger.info("Processing PDF", path=pdf_path, job_id=job_id)
        
        try:
            from pdf2image import convert_from_path
            
            # Convert PDF to images
            logger.info("Converting PDF to images", job_id=job_id)
            images = convert_from_path(pdf_path)
            
            log_assert(
                len(images) > 0,
                "No pages found in PDF",
                path=pdf_path
            )
            
            logger.info("PDF converted", pages=len(images), job_id=job_id)
            
            # Parse page range
            pages_to_process = self._parse_page_range(
                options.page_range,
                len(images)
            )
            
            logger.info(
                "Processing pages",
                total_pages=len(images),
                pages_to_process=pages_to_process,
                job_id=job_id
            )
            
            # Process each page
            all_content = []
            for idx, page_num in enumerate(pages_to_process):
                logger.info(
                    "Processing page",
                    page=page_num,
                    progress=f"{idx + 1}/{len(pages_to_process)}",
                    job_id=job_id
                )
                
                image = images[page_num - 1]  # 1-indexed to 0-indexed
                
                if self.method == "hf":
                    content = await self._process_with_hf(image, options)
                else:
                    # Save temp image for vLLM
                    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                        image.save(tmp.name)
                        content = await self._process_with_vllm(tmp.name, options)
                        os.unlink(tmp.name)
                
                all_content.append(f"# Page {page_num}\n\n{content}")
            
            # Combine all pages
            final_content = "\n\n---\n\n".join(all_content)
            
            result = OCRResult(
                content=final_content,
                metadata={
                    "job_id": job_id,
                    "file_type": "pdf",
                    "total_pages": len(images),
                    "processed_pages": len(pages_to_process),
                    "pages": pages_to_process,
                },
                images=None if not options.include_images else []
            )
            
            logger.success("PDF processed successfully", job_id=job_id, pages=len(pages_to_process))
            return result
            
        except Exception as e:
            logger.error("PDF processing failed", job_id=job_id, error=str(e))
            raise
    
    async def _process_with_hf(self, image: Image.Image, options: OCROptions) -> str:
        """Process image with Hugging Face transformers"""
        import torch
        
        logger.debug("Processing with Hugging Face")
        
        try:
            # Prepare inputs
            inputs = self.processor(images=image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Generate
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=options.max_output_tokens,
                    do_sample=False,
                )
            
            # Decode
            content = self.processor.batch_decode(
                outputs,
                skip_special_tokens=True
            )[0]
            
            debug_assert(
                len(content) > 0,
                "Empty content generated",
                content_length=len(content)
            )
            
            return content
            
        except Exception as e:
            logger.error("HF processing failed", error=str(e))
            raise
    
    async def _process_with_vllm(self, image_path: str, options: OCROptions) -> str:
        """Process image with vLLM"""
        logger.debug("Processing with vLLM", image=image_path)
        
        try:
            # Read image as base64
            import base64
            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode("utf-8")
            
            # Call vLLM API
            response = self.vllm_client.chat.completions.create(
                model=settings.vllm_model_name,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_data}"}},
                            {"type": "text", "text": "Extract all text from this image."}
                        ]
                    }
                ],
                max_tokens=options.max_output_tokens,
            )
            
            content = response.choices[0].message.content
            
            debug_assert(
                len(content) > 0,
                "Empty content generated",
                content_length=len(content)
            )
            
            return content
            
        except Exception as e:
            logger.error("vLLM processing failed", error=str(e))
            raise
    
    def _parse_page_range(self, range_str: Optional[str], total_pages: int) -> List[int]:
        """Parse page range string into list of page numbers"""
        if not range_str:
            return list(range(1, total_pages + 1))
        
        pages = set()
        parts = range_str.split(",")
        
        for part in parts:
            part = part.strip()
            if "-" in part:
                start, end = part.split("-")
                start, end = int(start), int(end)
                log_assert(
                    1 <= start <= end <= total_pages,
                    "Invalid page range",
                    start=start,
                    end=end,
                    total_pages=total_pages
                )
                pages.update(range(start, end + 1))
            else:
                page = int(part)
                log_assert(
                    1 <= page <= total_pages,
                    "Invalid page number",
                    page=page,
                    total_pages=total_pages
                )
                pages.add(page)
        
        return sorted(list(pages))


# Global service instance
ocr_service = ChandraOCRService()

