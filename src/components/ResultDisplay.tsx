import { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';

interface ResultDisplayProps {
  result: {
    content: string;
    metadata?: Record<string, any>;
    images?: string[];
  };
  format: 'markdown' | 'html' | 'json';
}

export default function ResultDisplay({ result, format }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'metadata' | 'images'>('content');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([result.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-result.${format === 'markdown' ? 'md' : format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
            activeTab === 'content'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Content
        </button>
        {result.metadata && (
          <button
            onClick={() => setActiveTab('metadata')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'metadata'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Metadata
          </button>
        )}
        {result.images && result.images.length > 0 && (
          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'images'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Images ({result.images.length})
          </button>
        )}
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div>
          <div className="flex justify-end space-x-2 mb-3">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm 
                       bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 
                       dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm 
                       bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 
                       dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>

          <div className="max-h-[600px] overflow-auto bg-gray-50 dark:bg-gray-900 
                        rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            {format === 'html' ? (
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: result.content }}
              />
            ) : (
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {result.content}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Metadata Tab */}
      {activeTab === 'metadata' && result.metadata && (
        <div className="max-h-[600px] overflow-auto bg-gray-50 dark:bg-gray-900 
                      rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <pre className="text-sm text-gray-800 dark:text-gray-200">
            {JSON.stringify(result.metadata, null, 2)}
          </pre>
        </div>
      )}

      {/* Images Tab */}
      {activeTab === 'images' && result.images && (
        <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-auto">
          {result.images.map((image, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-2"
            >
              <img
                src={image}
                alt={`Extracted image ${index + 1}`}
                className="w-full h-auto rounded"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

