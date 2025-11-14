import type { NextApiRequest, NextApiResponse } from 'next';
import logger from '@/lib/logger';
import { pythonAPIClient } from '@/lib/api-client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  logger.info('Health check requested');

  try {
    const pythonApiHealthy = await pythonAPIClient.healthCheck();

    const health = {
      status: pythonApiHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        nextjs: 'healthy',
        pythonApi: pythonApiHealthy ? 'healthy' : 'unhealthy',
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        pythonApiUrl: process.env.PYTHON_API_URL,
      },
    };

    logger.info('Health check completed', health);

    const statusCode = pythonApiHealthy ? 200 : 503;
    return res.status(statusCode).json(health);

  } catch (error: any) {
    logger.error('Health check failed', {
      error: error.message,
      stack: error.stack,
    });

    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        nextjs: 'healthy',
        pythonApi: 'unhealthy',
      },
      error: error.message,
    });
  }
}

