"use client";

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8', 
    large: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`animate-spin rounded-full border-2 border-gray-600 border-t-blue-400 ${sizeClasses[size]}`}></div>
      {message && (
        <p className="text-gray-400 text-sm">{message}</p>
      )}
    </div>
  );
};

const LoadingOverlay = ({ isLoading, message, children }) => {
  if (!isLoading) return children;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <LoadingSpinner size="large" message={message} />
        </div>
      </div>
    </div>
  );
};

const SkeletonLoader = ({ className = "" }) => {
  return (
    <div className={`animate-pulse bg-gray-700 rounded ${className}`}></div>
  );
};

export { LoadingSpinner, LoadingOverlay, SkeletonLoader };