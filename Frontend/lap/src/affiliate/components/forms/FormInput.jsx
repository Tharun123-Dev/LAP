import React from 'react';
import { cn } from '../../utils/helpers';

export const FormInput = React.forwardRef(({
  label,
  id,
  type = 'text',
  error,
  helperText,
  className,
  placeholder,
  required = false,
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label 
          htmlFor={id} 
          className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        type={type}
        id={id}
        placeholder={placeholder}
        required={required}
        className={cn(
          "w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-950 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200",
          error && "border-rose-500 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500",
          className
        )}
        {...props}
      />
      
      {error ? (
        <span className="text-xs font-bold text-rose-500 mt-0.5">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-slate-400 dark:text-slate-500">{helperText}</span>
      ) : null}
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;