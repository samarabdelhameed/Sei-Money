import React from 'react';

interface MetaMaskErrorHandlerProps {
  children?: React.ReactNode;
  className?: string;
};
  export const MetaMaskErrorHandler: React.FC<MetaMaskErrorHandlerProps> = ({ 
  children, 
  className = ''
}) => {
  return (
    <<div className={`metamaskerrorhandler ${className || ""}`}>
      {children || <div>Loading...</div>}
    </div>
  );
};

export default MetaMaskErrorHandler;
