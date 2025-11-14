import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface StatusIndicatorProps {
  status: JobStatus;
}

export default function StatusIndicator({ status }: StatusIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status.status) {
      case 'pending':
        return {
          icon: <Clock className="h-6 w-6 text-yellow-500" />,
          color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          text: 'Pending',
          description: 'Your job is in the queue',
        };
      case 'processing':
        return {
          icon: <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />,
          color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          text: 'Processing',
          description: 'OCR is analyzing your document',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-6 w-6 text-green-500" />,
          color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          text: 'Completed',
          description: 'Processing finished successfully',
        };
      case 'failed':
        return {
          icon: <XCircle className="h-6 w-6 text-red-500" />,
          color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          text: 'Failed',
          description: status.error || 'Processing encountered an error',
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <div className={`border rounded-lg p-4 ${display.color}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">{display.icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {display.text}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {display.description}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            Job ID: {status.jobId}
          </p>
        </div>
      </div>
    </div>
  );
}

