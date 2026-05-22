import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height }) => {
  return (
    <div
      className={`animate-pulse bg-slate-100 rounded-sm ${className}`}
      style={{ width, height }}
    />
  );
};

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns, rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-3 py-4">
              <Skeleton height={14} className={colIndex === 0 ? 'w-8' : 'w-full'} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export const CardSkeleton = () => (
  <div className="admin-card">
    <div className="admin-card-header">
       <Skeleton width={100} height={16} />
    </div>
    <div className="admin-card-body space-y-3">
       <Skeleton width="100%" height={12} />
       <Skeleton width="80%" height={12} />
       <Skeleton width="90%" height={12} />
    </div>
  </div>
);

export const FormSkeleton = ({ groups = 2 }: { groups?: number }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2 space-y-8">
      {Array.from({ length: groups }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
    <div className="space-y-8">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);
