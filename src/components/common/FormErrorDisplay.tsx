import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface SubmissionStatus {
  status: 'idle' | 'validating' | 'submitting' | 'success' | 'error';
  error?: string;
}

interface FormErrorDisplayProps {
  errors: string[];
  submissionStatus?: SubmissionStatus;
  className?: string;
}

const FormErrorDisplay: React.FC<FormErrorDisplayProps> = ({
  errors,
  submissionStatus,
  className = ''
}) => {
  // Combine form validation errors with submission status errors
  const allErrors = [...errors];
  
  if (submissionStatus?.status === 'error' && submissionStatus.error) {
    allErrors.push(submissionStatus.error);
  }

  // Don't render if no errors
  if (allErrors.length === 0) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-red-800 font-medium text-sm sm:text-base">
            {allErrors.length === 1 ? 'Error' : 'Errors'}
          </h3>
          {allErrors.length === 1 ? (
            <p className="text-red-600 text-sm mt-1">
              {allErrors[0]}
            </p>
          ) : (
            <ul className="text-red-600 text-sm mt-1 space-y-1">
              {allErrors.map((error, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormErrorDisplay;