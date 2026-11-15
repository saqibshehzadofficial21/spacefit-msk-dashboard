import { forwardRef } from 'react';
import { Search } from 'lucide-react';

/** Labelled form field wrapper that shows an accessible error message. */
export function Field({ label, htmlFor, error, hint, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-secondary">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-status-critical" role="alert">{error}</p>}
    </div>
  );
}

export const Input = forwardRef(function Input({ error, className = '', ...props }, ref) {
  return <input ref={ref} className={`input-base ${error ? 'input-error' : ''} ${className}`} aria-invalid={!!error} {...props} />;
});

export const Select = forwardRef(function Select({ error, className = '', children, ...props }, ref) {
  return (
    <select ref={ref} className={`input-base ${error ? 'input-error' : ''} ${className}`} aria-invalid={!!error} {...props}>
      {children}
    </select>
  );
});

export const Textarea = forwardRef(function Textarea({ error, className = '', ...props }, ref) {
  return <textarea ref={ref} rows={3} className={`input-base ${error ? 'input-error' : ''} ${className}`} aria-invalid={!!error} {...props} />;
});

export function SearchBox({ value, onChange, placeholder = 'Search…', label = 'Search', className = '', id = 'search-box' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        id={id}
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-base pl-9"
      />
    </div>
  );
}
