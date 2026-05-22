import React from 'react';

interface CardProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  icon,
  children, 
  headerActions, 
  footer, 
  className = '', 
  bodyClassName = '' 
}) => {
  return (
    <div className={`admin-card ${className}`}>
      {title && (
        <div className="admin-card-header">
          <div className="flex items-center gap-2">
            {icon && <span className="flex-shrink-0 text-slate-500">{icon}</span>}
            <span>{title}</span>
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div className={`admin-card-body ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          {footer}
        </div>
      )}
    </div>
  );
};
