import { z } from 'zod';

// File validation schema
export const fileUploadSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z.number().positive().max(
    parseInt(process.env.MAX_FILE_SIZE || '52428800'), 
    'File size exceeds maximum allowed size (50MB)'
  ),
  type: z.string().refine(
    (type) => {
      const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 
        'application/pdf,image/png,image/jpeg,image/jpg,image/webp').split(',');
      return allowedTypes.includes(type);
    },
    'Invalid file type. Allowed types: PDF, PNG, JPEG, JPG, WEBP'
  ),
});

// OCR request schema
export const ocrRequestSchema = z.object({
  pageRange: z.string().optional().refine(
    (range) => {
      if (!range) return true;
      // Validate format like "1-5,7,9-12"
      const pattern = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/;
      return pattern.test(range);
    },
    'Invalid page range format. Use format like: 1-5,7,9-12'
  ),
  maxOutputTokens: z.number()
    .int()
    .positive()
    .max(32768)
    .default(parseInt(process.env.MAX_OUTPUT_TOKENS || '8192')),
  includeImages: z.boolean().default(
    process.env.INCLUDE_IMAGES === 'true'
  ),
  includeHeadersFooters: z.boolean().default(
    process.env.INCLUDE_HEADERS_FOOTERS === 'true'
  ),
  outputFormat: z.enum(['markdown', 'html', 'json']).default('markdown'),
});

export type FileUpload = z.infer<typeof fileUploadSchema>;
export type OCRRequest = z.infer<typeof ocrRequestSchema>;

// API response schemas
export const ocrResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    jobId: z.string(),
    status: z.enum(['pending', 'processing', 'completed', 'failed']),
    result: z.object({
      content: z.string().optional(),
      metadata: z.record(z.any()).optional(),
      images: z.array(z.string()).optional(),
    }).optional(),
    error: z.string().optional(),
  }),
  timestamp: z.string(),
});

export type OCRResponse = z.infer<typeof ocrResponseSchema>;

// Error response schema
export const errorResponseSchema = z.object({
  success: z.boolean().default(false),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.record(z.any()).optional(),
  }),
  timestamp: z.string(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

