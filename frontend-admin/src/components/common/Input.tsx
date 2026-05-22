import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string;
  helpText?: string;
  multiline?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  multiline = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : Math.random().toString(36).substr(2, 9));

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="admin-label">
          {label}
        </label>
      )}
      
      {multiline ? (
        <textarea
          id={inputId}
          className={`admin-input min-h-[100px] py-2 ${error ? 'border-red-500' : ''}`}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={inputId}
          className={`admin-input ${error ? 'border-red-500' : ''}`}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {helpText && <p className="mt-1 text-[0.7rem] text-slate-500 font-medium">{helpText}</p>}
      {error && <p className="mt-1 text-[0.75rem] text-red-600 font-bold">{error}</p>}
    </div>
  );
};

export default Input;
