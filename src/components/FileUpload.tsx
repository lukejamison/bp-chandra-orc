import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export default function FileUpload({ onFileSelect, selectedFile }: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '52428800'),
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null as any);
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          {isDragActive ? (
            <p className="text-blue-600 dark:text-blue-400 font-medium">
              Drop the file here...
            </p>
          ) : (
            <>
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                Drag & drop a file here, or click to select
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supported formats: PDF, PNG, JPEG, WEBP (max 50MB)
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="border-2 border-green-500 dark:border-green-600 rounded-lg p-6 
                      bg-green-50 dark:bg-green-900/20">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <File className="h-8 w-8 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="ml-4 text-gray-400 hover:text-red-600 dark:hover:text-red-400 
                       transition-colors"
              aria-label="Remove file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

