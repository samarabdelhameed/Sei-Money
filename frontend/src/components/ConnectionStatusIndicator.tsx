import React from 'react';

interface ConnectionStatusIndicatorProps {
  children?: React.ReactNode;
  className?: string;
};
  export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({ 
  children, 
  className = ""
}) => {
  return (
    <div className={`connectionstatusindicator ${className || ""}`}>
      {children || <div>Loading...</div>}
    </div>
  );
};

export default ConnectionStatusIndicator;
