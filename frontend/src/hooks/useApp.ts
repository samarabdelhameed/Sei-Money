import { useContext } from 'react';
import AppContext from '../contexts/AppContext';
import { AppContextType } from '../types';

// Hook to use the context;
  export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  };
  return context;
};

export default useApp;