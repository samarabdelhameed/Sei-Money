import React from 'react';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
  className?: string;
};
  export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ 
  children, 
  className = ""
}) => {
  return (
    <div className={`errorboundary ${className || ""}`}>
      {children || <div>Loading...</div>}
    </div>
  );
};

export default ErrorBoundary;
