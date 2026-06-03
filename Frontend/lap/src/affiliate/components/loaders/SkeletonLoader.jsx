import React from 'react';
import { cn } from '../../utils/helpers';

export const SkeletonLoader = ({
  variant = 'card', // 'card' | 'table' | 'text' | 'circle'
  className,
  count = 1,
}) => {
  const shimmerClass = 'shimmer rounded-xl';

  const renderSkeleton = () => {
    switch (variant) {
      case 'circle':
        return (
          <div className={cn("w-12 h-12 rounded-full", shimmerClass, className)} />
        );
      case 'text':
        return (
          <div className="space-y-2 w-full">
            <div className={cn("h-4 w-3/4", shimmerClass, className)} />
            <div className={cn("h-3 w-1/2", shimmerClass, className)} />
          </div>
        );
      case 'table':
        return (
          <div className="space-y-3.5 w-full">
            <div className={cn("h-10 w-full", shimmerClass, className)} />
            {[...Array(4)].map((_, i) => (
              <div key={i} className={cn("h-12 w-full", shimmerClass, className)} />
            ))}
          </div>
        );
      case 'card':
      default:
        return (
          <div className={cn("glass-card p-6 rounded-2xl h-36 flex flex-col justify-between", className)}>
            <div className="space-y-2">
              <div className={cn("h-3.5 w-1/3", shimmerClass)} />
              <div className={cn("h-8 w-1/2", shimmerClass)} />
            </div>
            <div className={cn("h-4.5 w-2/3", shimmerClass)} />
          </div>
        );
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </>
  );
};

export default SkeletonLoader;