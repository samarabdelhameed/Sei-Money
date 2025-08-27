import React from 'react';

interface WalletAvailabilityIndicatorProps {
  children?: React.ReactNode;
  className?: string;
};
  export const WalletAvailabilityIndicator: React.FC<WalletAvailabilityIndicatorProps> = ({ 
  children, 
  className = ''
}) => {
  return (
    <<div className={`walletavailabilityindicator ${className || ""}`}>
      {children || <div>Loading...</div>}
    </div>
  );
};

export default WalletAvailabilityIndicator;
