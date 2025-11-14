import axios, { AxiosError, AxiosInstance } from 'axios';
import logger, { assert } from './logger';

class PythonAPIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.PYTHON_API_URL || 'http://localhost:8001';
    
    assert(
      this.baseURL.length > 0, 
      'PYTHON_API_URL must be configured',
      { baseURL: this.baseURL }
    );

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 300000, // 5 minutes for OCR processing
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.PYTHON_API_KEY && {
          'X-API-Key': process.env.PYTHON_API_KEY,
        }),
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.info('API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
        });
        return config;
      },
      (error) => {
        logger.error('API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.info('API Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: AxiosError) => {
        const errorMessage = error.response?.data || error.message;
        logger.error('API Response Error', {
          status: error.response?.status,
          message: errorMessage,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      assert(response.status === 200, 'Health check failed', { status: response.status });
      return true;
    } catch (error) {
      logger.error('Health check failed', { error });
      return false;
    }
  }

  async processOCR(formData: FormData): Promise<any> {
    try {
      logger.info('Starting OCR processing');
      
      const response = await this.client.post('/api/v1/ocr/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      assert(
        response.data && response.data.success,
        'Invalid OCR response structure',
        { data: response.data }
      );

      logger.info('OCR processing initiated', { 
        jobId: response.data.data?.jobId 
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('OCR processing failed', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw new Error(
          error.response?.data?.error?.message || 'OCR processing failed'
        );
      }
      throw error;
    }
  }

  async getJobStatus(jobId: string): Promise<any> {
    try {
      assert(jobId && jobId.length > 0, 'Job ID is required', { jobId });

      logger.info('Checking job status', { jobId });

      const response = await this.client.get(`/api/v1/ocr/status/${jobId}`);

      assert(
        response.data && response.data.success !== undefined,
        'Invalid status response structure',
        { data: response.data }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Job status check failed', {
          jobId,
          status: error.response?.status,
          data: error.response?.data,
        });
        throw new Error(
          error.response?.data?.error?.message || 'Failed to check job status'
        );
      }
      throw error;
    }
  }

  async getJobResult(jobId: string): Promise<any> {
    try {
      assert(jobId && jobId.length > 0, 'Job ID is required', { jobId });

      logger.info('Fetching job result', { jobId });

      const response = await this.client.get(`/api/v1/ocr/result/${jobId}`);

      assert(
        response.data && response.data.success !== undefined,
        'Invalid result response structure',
        { data: response.data }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Job result fetch failed', {
          jobId,
          status: error.response?.status,
          data: error.response?.data,
        });
        throw new Error(
          error.response?.data?.error?.message || 'Failed to fetch job result'
        );
      }
      throw error;
    }
  }
}

// Export singleton instance
export const pythonAPIClient = new PythonAPIClient();

