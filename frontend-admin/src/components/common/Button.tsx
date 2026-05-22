import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'default' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const variants = {
    primary: 'admin-btn-primary',
    secondary: 'bg-slate-500 text-white hover:bg-slate-600',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'admin-btn-danger',
    outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
    default: 'admin-btn-default',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`admin-btn ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
