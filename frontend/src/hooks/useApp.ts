import { useContext } from 'react';
import { useApp as useAppFromContext } from '../contexts/AppContext';

export const useApp = useAppFromContext;
export default useApp;