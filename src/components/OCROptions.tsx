import type { OCRRequest } from '@/lib/validation';

interface OCROptionsProps {
  options: OCRRequest;
  onChange: (options: Partial<OCRRequest>) => void;
}

export default function OCROptions({ options, onChange }: OCROptionsProps) {
  return (
    <div className="space-y-4">
      {/* Page Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Page Range (optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-5,7,9-12"
          value={options.pageRange || ''}
          onChange={(e) => onChange({ pageRange: e.target.value || undefined })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 
                   rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 
                   dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Leave blank to process all pages
        </p>
      </div>

      {/* Output Format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Output Format
        </label>
        <select
          value={options.outputFormat}
          onChange={(e) =>
            onChange({ outputFormat: e.target.value as 'markdown' | 'html' | 'json' })
          }
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 
                   rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 
                   dark:text-white"
        >
          <option value="markdown">Markdown</option>
          <option value="html">HTML</option>
          <option value="json">JSON</option>
        </select>
      </div>

      {/* Max Output Tokens */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Max Output Tokens: {options.maxOutputTokens}
        </label>
        <input
          type="range"
          min="1024"
          max="32768"
          step="1024"
          value={options.maxOutputTokens}
          onChange={(e) => onChange({ maxOutputTokens: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>1K</span>
          <span>32K</span>
        </div>
      </div>

      {/* Include Images */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Extract Images
        </label>
        <button
          type="button"
          onClick={() => onChange({ includeImages: !options.includeImages })}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors duration-200 ease-in-out focus:outline-none 
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${options.includeImages ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white 
              transition-transform duration-200 ease-in-out
              ${options.includeImages ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Include Headers & Footers */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Include Headers & Footers
        </label>
        <button
          type="button"
          onClick={() =>
            onChange({ includeHeadersFooters: !options.includeHeadersFooters })
          }
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors duration-200 ease-in-out focus:outline-none 
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${
              options.includeHeadersFooters
                ? 'bg-blue-600'
                : 'bg-gray-300 dark:bg-gray-600'
            }
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white 
              transition-transform duration-200 ease-in-out
              ${options.includeHeadersFooters ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    </div>
  );
}

