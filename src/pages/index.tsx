import { useState } from 'react';
import Head from 'next/head';
import FileUpload from '@/components/FileUpload';
import OCROptions from '@/components/OCROptions';
import ResultDisplay from '@/components/ResultDisplay';
import StatusIndicator from '@/components/StatusIndicator';
import type { OCRRequest } from '@/lib/validation';

interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    content: string;
    metadata?: Record<string, any>;
    images?: string[];
  };
  error?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<OCRRequest>({
    maxOutputTokens: 8192,
    includeImages: true,
    includeHeadersFooters: false,
    outputFormat: 'markdown',
  });
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setJobStatus(null);
  };

  const handleOptionsChange = (newOptions: Partial<OCRRequest>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  };

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/ocr/status/${jobId}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to check status');
        }

        setJobStatus(data.data);

        if (data.data.status === 'completed') {
          // Fetch full result
          const resultResponse = await fetch(`/api/ocr/result/${jobId}`);
          const resultData = await resultResponse.json();

          if (resultData.success) {
            setJobStatus(resultData.data);
          }
          setIsProcessing(false);
          return;
        }

        if (data.data.status === 'failed') {
          setError(data.data.error || 'Processing failed');
          setIsProcessing(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setError('Processing timeout - please check back later');
          setIsProcessing(false);
        }
      } catch (err: any) {
        setError(err.message);
        setIsProcessing(false);
      }
    };

    poll();
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setJobStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.pageRange) {
        formData.append('pageRange', options.pageRange);
      }
      formData.append('maxOutputTokens', options.maxOutputTokens.toString());
      formData.append('includeImages', options.includeImages.toString());
      formData.append('includeHeadersFooters', options.includeHeadersFooters.toString());
      formData.append('outputFormat', options.outputFormat);

      const response = await fetch('/api/ocr/process', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Processing failed');
      }

      const jobId = data.data.jobId;
      setJobStatus({ jobId, status: 'pending' });

      // Start polling for status
      pollJobStatus(jobId);

    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Head>
        <title>Chandra OCR - Document Processing</title>
        <meta name="description" content="Convert documents to structured text with Chandra OCR" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Chandra OCR
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Convert documents to structured text with advanced OCR
            </p>
          </div>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Upload & Options */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Upload Document
                  </h2>
                  <FileUpload onFileSelect={handleFileSelect} selectedFile={file} />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Processing Options
                  </h2>
                  <OCROptions options={options} onChange={handleOptionsChange} />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!file || isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                           text-white font-semibold py-3 px-6 rounded-lg 
                           transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Process Document'}
                </button>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 
                                dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200 font-medium">
                      Error: {error}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column - Status & Results */}
              <div className="space-y-6">
                {jobStatus && (
                  <>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                        Processing Status
                      </h2>
                      <StatusIndicator status={jobStatus} />
                    </div>

                    {jobStatus.status === 'completed' && jobStatus.result && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                          Results
                        </h2>
                        <ResultDisplay 
                          result={jobStatus.result} 
                          format={options.outputFormat} 
                        />
                      </div>
                    )}
                  </>
                )}

                {!jobStatus && !isProcessing && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 
                                text-center text-gray-500 dark:text-gray-400">
                    <p>Upload a document and click "Process Document" to begin</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-gray-600 dark:text-gray-400">
            <p>
              Powered by{' '}
              <a
                href="https://github.com/datalab-to/chandra"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 
                         dark:hover:text-blue-300 font-medium"
              >
                Chandra OCR
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

