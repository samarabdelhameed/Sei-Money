import React from 'react';

interface AlternativeWalletSelectorProps {
  children?: React.ReactNode;
  className?: string;
};
  export const AlternativeWalletSelector: React.FC<AlternativeWalletSelectorProps> = ({ 
  children, 
  className = ""
}) => {
  return (
    <div className={`alternativewalletselector ${className || ""}`}>
      {children || <div>Loading...</div>}
    </div>
  );
};

export default AlternativeWalletSelector;
