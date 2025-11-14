import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger, { assert } from '@/lib/logger';
import { ocrRequestSchema, fileUploadSchema } from '@/lib/validation';
import { pythonAPIClient } from '@/lib/api-client';
import { sanitizeFilename } from '@/lib/utils';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface FormidableFile {
  filepath: string;
  originalFilename: string | null;
  mimetype: string | null;
  size: number;
}

async function parseForm(req: NextApiRequest): Promise<{
  fields: formidable.Fields;
  files: formidable.Files;
}> {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  
  // Ensure upload directory exists
  await fs.mkdir(uploadDir, { recursive: true });

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB default
    multiples: false,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        logger.error('Form parsing failed', { error: err });
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const requestId = uuidv4();
  const startTime = Date.now();

  logger.info('OCR process request received', {
    requestId,
    method: req.method,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
    },
  });

  if (req.method !== 'POST') {
    logger.warn('Invalid method', { requestId, method: req.method });
    return res.status(405).json({
      success: false,
      error: {
        message: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
      },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Parse multipart form data
    const { fields, files } = await parseForm(req);

    logger.info('Form parsed successfully', {
      requestId,
      fieldKeys: Object.keys(fields),
      fileKeys: Object.keys(files),
    });

    // Validate file upload
    const fileArray = files.file as FormidableFile[] | FormidableFile | undefined;
    const uploadedFile = Array.isArray(fileArray) ? fileArray[0] : fileArray;

    assert(
      uploadedFile !== undefined,
      'No file uploaded',
      { requestId, files: Object.keys(files) }
    );

    // Validate file properties
    const fileValidation = fileUploadSchema.safeParse({
      name: uploadedFile.originalFilename || 'unknown',
      size: uploadedFile.size,
      type: uploadedFile.mimetype || 'application/octet-stream',
    });

    if (!fileValidation.success) {
      logger.error('File validation failed', {
        requestId,
        errors: fileValidation.error.errors,
        file: {
          name: uploadedFile.originalFilename,
          size: uploadedFile.size,
          type: uploadedFile.mimetype,
        },
      });

      // Clean up uploaded file
      await fs.unlink(uploadedFile.filepath).catch((err) => {
        logger.warn('Failed to clean up invalid file', { requestId, error: err });
      });

      return res.status(400).json({
        success: false,
        error: {
          message: 'File validation failed',
          code: 'INVALID_FILE',
          details: fileValidation.error.errors,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Parse and validate OCR options
    const getFieldValue = (field: string | string[] | undefined): string | undefined => {
      if (Array.isArray(field)) return field[0];
      return field;
    };

    const ocrOptions = ocrRequestSchema.safeParse({
      pageRange: getFieldValue(fields.pageRange),
      maxOutputTokens: fields.maxOutputTokens 
        ? parseInt(getFieldValue(fields.maxOutputTokens) || '8192') 
        : undefined,
      includeImages: fields.includeImages === 'true' || fields.includeImages === true,
      includeHeadersFooters: fields.includeHeadersFooters === 'true' || fields.includeHeadersFooters === true,
      outputFormat: getFieldValue(fields.outputFormat) || 'markdown',
    });

    if (!ocrOptions.success) {
      logger.error('OCR options validation failed', {
        requestId,
        errors: ocrOptions.error.errors,
      });

      // Clean up uploaded file
      await fs.unlink(uploadedFile.filepath).catch((err) => {
        logger.warn('Failed to clean up file after validation error', { 
          requestId, 
          error: err 
        });
      });

      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid OCR options',
          code: 'INVALID_OPTIONS',
          details: ocrOptions.error.errors,
        },
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Validation successful', {
      requestId,
      file: {
        name: uploadedFile.originalFilename,
        size: uploadedFile.size,
        type: uploadedFile.mimetype,
      },
      options: ocrOptions.data,
    });

    // Read file and prepare for Python API
    const fileBuffer = await fs.readFile(uploadedFile.filepath);
    const formData = new FormData();
    
    const sanitizedFilename = sanitizeFilename(
      uploadedFile.originalFilename || 'document'
    );
    
    const blob = new Blob([fileBuffer], { type: uploadedFile.mimetype || undefined });
    formData.append('file', blob, sanitizedFilename);
    formData.append('options', JSON.stringify(ocrOptions.data));
    formData.append('requestId', requestId);

    logger.info('Sending to Python API', {
      requestId,
      filename: sanitizedFilename,
      optionsSize: JSON.stringify(ocrOptions.data).length,
    });

    // Send to Python API for processing
    const result = await pythonAPIClient.processOCR(formData);

    // Clean up uploaded file
    await fs.unlink(uploadedFile.filepath).catch((err) => {
      logger.warn('Failed to clean up processed file', { 
        requestId, 
        error: err 
      });
    });

    const duration = Date.now() - startTime;

    logger.info('OCR process completed successfully', {
      requestId,
      jobId: result.data?.jobId,
      duration: `${duration}ms`,
    });

    return res.status(200).json({
      ...result,
      requestId,
      duration,
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;

    logger.error('OCR process failed', {
      requestId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Internal server error',
        code: 'PROCESSING_ERROR',
      },
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
}

