import type { NextApiRequest, NextApiResponse } from 'next';
import logger, { assert } from '@/lib/logger';
import { pythonAPIClient } from '@/lib/api-client';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const requestId = uuidv4();
  const startTime = Date.now();

  logger.info('Job status request received', {
    requestId,
    method: req.method,
    jobId: req.query.jobId,
  });

  if (req.method !== 'GET') {
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
    const { jobId } = req.query;

    assert(
      typeof jobId === 'string' && jobId.length > 0,
      'Invalid job ID',
      { requestId, jobId }
    );

    logger.info('Checking job status', { requestId, jobId });

    const result = await pythonAPIClient.getJobStatus(jobId);

    const duration = Date.now() - startTime;

    logger.info('Job status retrieved', {
      requestId,
      jobId,
      status: result.data?.status,
      duration: `${duration}ms`,
    });

    return res.status(200).json({
      ...result,
      requestId,
      duration,
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;

    logger.error('Failed to retrieve job status', {
      requestId,
      jobId: req.query.jobId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to retrieve job status',
        code: 'STATUS_CHECK_ERROR',
      },
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
}

