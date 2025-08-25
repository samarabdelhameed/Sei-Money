import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { apiService, ApiError } from '../lib/api';
import { keplrWallet } from '../lib/wallets/keplr';
import { metamaskWallet } from '../lib/wallets/metamask';
import { leapWallet } from '../lib/wallets/leap';
import { transactionService } from '../lib/transaction-service';
import { User, Wallet, Transfer, Group, SavingsPot, Vault, EscrowCase, MarketData } from '../types';

// App State Interface
interface AppState {
  // User & Wallet
  user: User | null;
  wallet: Wallet | null;
  isWalletConnected: boolean;
  
  // Data
  transfers: Transfer[];
  groups: Group[];
  pots: SavingsPot[];
  vaults: Vault[];
  escrows: EscrowCase[];
  marketData: MarketData | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  notifications: Notification[];
  
  // AI Agent
  aiAgentStatus: 'online' | 'offline' | 'connecting';
  aiRecommendations: any[];
}

// Action Types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_WALLET'; payload: Wallet | null }
  | { type: 'SET_WALLET_CONNECTED'; payload: boolean }
  | { type: 'SET_TRANSFERS'; payload: Transfer[] }
  | { type: 'SET_GROUPS'; payload: Group[] }
  | { type: 'SET_POTS'; payload: SavingsPot[] }
  | { type: 'SET_VAULTS'; payload: Vault[] }
  | { type: 'SET_ESCROWS'; payload: EscrowCase[] }
  | { type: 'SET_MARKET_DATA'; payload: MarketData }
  | { type: 'SET_AI_AGENT_STATUS'; payload: 'online' | 'offline' | 'connecting' }
  | { type: 'SET_AI_RECOMMENDATIONS'; payload: any[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Initial State
const initialState: AppState = {
  user: null,
  wallet: null,
  isWalletConnected: false,
  transfers: [],
  groups: [],
  pots: [],
  vaults: [],
  escrows: [],
  marketData: null,
  isLoading: false,
  error: null,
  notifications: [],
  aiAgentStatus: 'offline',
  aiRecommendations: [],
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_WALLET':
      return { ...state, wallet: action.payload };
    case 'SET_WALLET_CONNECTED':
      return { ...state, isWalletConnected: action.payload };
    case 'SET_TRANSFERS':
      return { ...state, transfers: action.payload };
    case 'SET_GROUPS':
      return { ...state, groups: action.payload };
    case 'SET_POTS':
      return { ...state, pots: action.payload };
    case 'SET_VAULTS':
      return { ...state, vaults: action.payload };
    case 'SET_ESCROWS':
      return { ...state, escrows: action.payload };
    case 'SET_MARKET_DATA':
      return { ...state, marketData: action.payload };
    case 'SET_AI_AGENT_STATUS':
      return { ...state, aiAgentStatus: action.payload };
    case 'SET_AI_RECOMMENDATIONS':
      return { ...state, aiRecommendations: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'REMOVE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    connectWallet: (provider: 'keplr' | 'leap' | 'metamask') => Promise<void>;
    disconnectWallet: () => Promise<void>;
    loadUserData: () => Promise<void>;
    loadTransfers: () => Promise<void>;
    loadGroups: () => Promise<void>;
    loadPots: () => Promise<void>;
    loadVaults: () => Promise<void>;
    loadEscrows: () => Promise<void>;
    loadMarketData: () => Promise<void>;
    createTransfer: (data: any) => Promise<void>;
    createGroup: (data: any) => Promise<void>;
    createPot: (data: any) => Promise<void>;
    createVault: (data: any) => Promise<void>;
    createEscrow: (data: any) => Promise<void>;
    connectAIAgent: () => Promise<void>;
    getAIRecommendations: () => Promise<void>;
    clearError: () => void;
    addNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    removeNotification: (id: string) => void;
  };
} | null>(null);

// Provider Component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const actions = {
    // Wallet Management
    connectWallet: async (provider: 'keplr' | 'leap' | 'metamask') => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        let address: string;
        let walletConnection: any = null;

        if (provider === 'keplr') {
          // Use the new Keplr wallet service
          if (!keplrWallet.isInstalled()) {
            throw new Error('Keplr wallet not installed. Please install Keplr extension.');
          }

          walletConnection = await keplrWallet.connect();
          address = walletConnection.address;

          console.log('Keplr wallet connected:', { address });
          
          // Get balance in background
          keplrWallet.getBalance().then(balance => {
            console.log('Keplr balance loaded:', balance);
          }).catch(error => {
            console.warn('Failed to load Keplr balance:', error);
          });

        } else if (provider === 'leap') {
          // Use the new Leap wallet service
          if (!leapWallet.isInstalled()) {
            throw new Error('Leap wallet not installed. Please install Leap extension.');
          }

          walletConnection = await leapWallet.connect();
          address = walletConnection.address;

          console.log('Leap wallet connected:', { address });
          
          // Get balance in background
          leapWallet.getBalance().then(balance => {
            console.log('Leap balance loaded:', balance);
          }).catch(error => {
            console.warn('Failed to load Leap balance:', error);
          });

        } else if (provider === 'metamask') {
          // Use the new MetaMask wallet service
          if (!metamaskWallet.isInstalled()) {
            throw new Error('MetaMask wallet not installed. Please install MetaMask extension.');
          }

          walletConnection = await metamaskWallet.connect();
          address = walletConnection.cosmosAddress; // Use Cosmos address for the app

          console.log('MetaMask wallet connected:', { 
            evmAddress: walletConnection.evmAddress,
            cosmosAddress: walletConnection.cosmosAddress
          });
          
          // Get balance in background to avoid blocking connection
          Promise.all([
            metamaskWallet.getEvmBalance(),
            metamaskWallet.getCosmosBalance()
          ]).then(([evmBalance, cosmosBalance]) => {
            console.log('MetaMask balances loaded:', { evmBalance, cosmosBalance });
          }).catch(error => {
            console.warn('Failed to load MetaMask balances:', error);
          });

        } else {
          throw new Error(`Unsupported wallet provider: ${provider}`);
        }

        // Connect to backend with timeout
        const wallet = await Promise.race([
          apiService.connectWallet({ provider, address }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Backend connection timeout')), 10000)
          )
        ]) as any;
        
        // Ensure balance is a number
        const walletWithBalance = {
          ...wallet,
          balance: typeof wallet.balance === 'number' ? wallet.balance : 0
        };
        
        dispatch({ type: 'SET_WALLET', payload: walletWithBalance });
        dispatch({ type: 'SET_WALLET_CONNECTED', payload: true });
        
        // Store wallet provider for future use
        localStorage.setItem('connected-wallet-provider', provider);
        
        // Set transaction service provider
        transactionService.setProvider(provider);
        
        // Load user data
        await actions.loadUserData();
        
        // Load unified balance from API
        try {
          const balanceResponse = await apiService.getUserBalance();
          if (balanceResponse.ok && balanceResponse.balance) {
            const unifiedBalance = {
              ...walletWithBalance,
              balance: parseFloat(balanceResponse.balance.formatted || '0')
            };
            dispatch({ type: 'SET_WALLET', payload: unifiedBalance });
          }
        } catch (error) {
          console.warn('Failed to load unified balance:', error);
        }
        
        dispatch({ type: 'ADD_NOTIFICATION', payload: {
          id: Date.now().toString(),
          message: `Connected to ${provider} wallet successfully`,
          type: 'success',
          timestamp: new Date()
        }});
        
      } catch (error) {
        console.error('Wallet connection error:', error);
        const message = error instanceof Error ? error.message : 'Failed to connect wallet';
        dispatch({ type: 'SET_ERROR', payload: message });
        dispatch({ type: 'ADD_NOTIFICATION', payload: {
          id: Date.now().toString(),
          message,
          type: 'error',
          timestamp: new Date()
        }});
        // Error handled above
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    disconnectWallet: async () => {
      try {
        // Get provider before clearing
        const provider = localStorage.getItem('connected-wallet-provider');
        
        // Disconnect from wallet services first
        if (provider === 'keplr') {
          try {
            await keplrWallet.disconnect();
          } catch (error) {
            console.warn('Keplr disconnect failed:', error);
          }
        } else if (provider === 'metamask') {
          try {
            await metamaskWallet.disconnect();
          } catch (error) {
            console.warn('MetaMask disconnect failed:', error);
          }
        } else if (provider === 'leap') {
          try {
            await leapWallet.disconnect();
          } catch (error) {
            console.warn('Leap disconnect failed:', error);
          }
        }
        
        // Try to disconnect from backend (optional - don't fail if it doesn't work)
        try {
          await apiService.disconnectWallet();
        } catch (error) {
          console.warn('Backend disconnect failed (continuing anyway):', error);
        }
        
        // Clear local storage
        localStorage.removeItem('connected-wallet-provider');
        localStorage.removeItem('wallet-address');
        localStorage.removeItem('wallet-balance');
        
        // Update state
        dispatch({ type: 'SET_WALLET', payload: null });
        dispatch({ type: 'SET_WALLET_CONNECTED', payload: false });
        dispatch({ type: 'SET_USER', payload: null });
        
        // Clear data arrays
        dispatch({ type: 'SET_TRANSFERS', payload: [] });
        dispatch({ type: 'SET_GROUPS', payload: [] });
        dispatch({ type: 'SET_POTS', payload: [] });
        dispatch({ type: 'SET_VAULTS', payload: [] });
        dispatch({ type: 'SET_ESCROWS', payload: [] });
        
        dispatch({ type: 'ADD_NOTIFICATION', payload: {
          id: Date.now().toString(),
          message: 'Wallet disconnected successfully',
          type: 'success',
          timestamp: new Date()
        }});
        
        console.log('✅ Wallet disconnected successfully');
        
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
        
        // Even if there's an error, still clear the state
        localStorage.removeItem('connected-wallet-provider');
        localStorage.removeItem('wallet-address');
        localStorage.removeItem('wallet-balance');
        
        dispatch({ type: 'SET_WALLET', payload: null });
        dispatch({ type: 'SET_WALLET_CONNECTED', payload: false });
        dispatch({ type: 'SET_USER', payload: null });
        
        dispatch({ type: 'ADD_NOTIFICATION', payload: {
          id: Date.now().toString(),
          message: 'Wallet disconnected (with some errors)',
          type: 'warning',
          timestamp: new Date()
        }});
      }
    },

    // Data Loading
    loadUserData: async () => {
      try {
        const [user, balance] = await Promise.all([
          apiService.getUserProfile(),
          apiService.getUserBalance()
        ]);
        
        dispatch({ type: 'SET_USER', payload: user });
        
        // Ensure balance is properly formatted
        const walletWithBalance = {
          ...balance,
          balance: typeof balance.balance === 'number' ? balance.balance : 
                  typeof balance.balance === 'string' ? parseFloat(balance.balance) || 0 : 0
        };
        
        dispatch({ type: 'SET_WALLET', payload: walletWithBalance });
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    },

    loadTransfers: async () => {
      try {
        const address = state.wallet?.address;
        if (!address) {
          dispatch({ type: 'SET_TRANSFERS', payload: [] });
          return;
        }
        const transfers = await apiService.getTransfers(address);
        dispatch({ type: 'SET_TRANSFERS', payload: transfers });
      } catch (error) {
        console.error('Error loading transfers:', error);
        // Set empty array on error to prevent UI issues
        dispatch({ type: 'SET_TRANSFERS', payload: [] });
      }
    },

    loadGroups: async () => {
      try {
        const groups = await apiService.getGroups();
        dispatch({ type: 'SET_GROUPS', payload: groups });
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    },

    loadPots: async () => {
      try {
        const pots = await apiService.getPots();
        dispatch({ type: 'SET_POTS', payload: pots });
      } catch (error) {
        console.error('Error loading pots:', error);
      }
    },

    loadVaults: async () => {
      try {
        const vaults = await apiService.getVaults();
        dispatch({ type: 'SET_VAULTS', payload: vaults });
      } catch (error) {
        console.error('Error loading vaults:', error);
      }
    },

    loadEscrows: async () => {
      try {
        const escrows = await apiService.getEscrows();
        dispatch({ type: 'SET_ESCROWS', payload: escrows });
      } catch (error) {
        console.error('Error loading escrows:', error);
      }
    },

    loadMarketData: async () => {
      try {
        const marketData = await apiService.getMarketData();
        dispatch({ type: 'SET_MARKET_DATA', payload: marketData });
      } catch (error) {
        console.error('Error loading market data:', error);
        // Set default market data to prevent UI issues
        dispatch({ type: 'SET_MARKET_DATA', payload: {
          platform: { name: 'SeiMoney', healthy: true },
          metrics: { totalValueLocked: 0, totalUsers: 0, totalTransactions: 0 },
          network: { healthy: true }
        } });
      }
    },

    // Create Operations
    createTransfer: async (data: any) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const transfer = await apiService.createTransfer(data);
        dispatch({ type: 'SET_TRANSFERS', payload: [...state.transfers, transfer] });
        
        dispatch({ type: 'ADD_NOTIFICATION', payload: {
          id: Date.now().toString(),
          message: 'Transfer created successfully',
          type: 'success',
          timestamp: new Date()
        }});
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to create transfer';
        dispatch({ type: 'SET_ERROR', payload: message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    createGroup: async (data: any) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const group = await apiService.createGroup(data);
        dispatch({ type: 'SET_GROUPS', payload: [...state.groups, group] });
        
        dispatch({ type: 'ADD_NOTIFICATION', payload: {
          id: Date.now().toString(),
          message: 'Group created successfully',
          type: 'success',
          timestamp: new Date()
        }});
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to create group';
        dispatch({ type: 'SET_ERROR', payload: message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    createPot: async (data: any) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const pot = await apiService.createPot(data);
        dispatch({ type: 'SET_POTS', payload: [...state.pots, pot] });
        
        dispatch({ type: 'ADD_NOTIFICATION', payload: {
          id: Date.now().toString(),
          message: 'Savings pot created successfully',
          type: 'success',
          timestamp: new Date()
        }});
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to create pot';
        dispatch({ type: 'SET_ERROR', payload: message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    createVault: async (data: any) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const vault = await apiService.createVault(data);
        dispatch({ type: 'SET_VAULTS', payload: [...state.vaults, vault] });
        
        dispatch({ type: 'ADD_NOTIFICATION', payload: {
          id: Date.now().toString(),
          message: 'Vault created successfully',
          type: 'success',
          timestamp: new Date()
        }});
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to create vault';
        dispatch({ type: 'SET_ERROR', payload: message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    createEscrow: async (data: any) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const escrow = await apiService.createEscrow(data);
        dispatch({ type: 'SET_ESCROWS', payload: [...state.escrows, escrow] });
        
        dispatch({ type: 'ADD_NOTIFICATION', payload: {
          id: Date.now().toString(),
          message: 'Escrow created successfully',
          type: 'success',
          timestamp: new Date()
        }});
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to create escrow';
        dispatch({ type: 'SET_ERROR', payload: message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    // AI Agent
    connectAIAgent: async () => {
      try {
        dispatch({ type: 'SET_AI_AGENT_STATUS', payload: 'connecting' });
        
        // Simulate AI agent connection
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        dispatch({ type: 'SET_AI_AGENT_STATUS', payload: 'online' });
        dispatch({ type: 'ADD_NOTIFICATION', payload: {
          id: Date.now().toString(),
          message: 'AI Agent connected successfully',
          type: 'success',
          timestamp: new Date()
        }});
        
        // Load AI recommendations
        await actions.getAIRecommendations();
        
      } catch (error) {
        dispatch({ type: 'SET_AI_AGENT_STATUS', payload: 'offline' });
        dispatch({ type: 'SET_ERROR', payload: 'Failed to connect AI Agent' });
      }
    },

    getAIRecommendations: async () => {
      try {
        // This would call the AI agent service
        const recommendations = [
          {
            id: '1',
            type: 'optimize',
            title: 'Portfolio Optimization',
            description: 'Consider rebalancing your portfolio for better returns',
            priority: 'high'
          },
          {
            id: '2',
            type: 'alert',
            title: 'Market Opportunity',
            description: 'New high-yield farming opportunity detected',
            priority: 'medium'
          }
        ];
        
        dispatch({ type: 'SET_AI_RECOMMENDATIONS', payload: recommendations });
      } catch (error) {
        console.error('Error loading AI recommendations:', error);
      }
    },

    // Utility Actions
    clearError: () => {
      dispatch({ type: 'CLEAR_ERROR' });
    },

    addNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: {
        id: Date.now().toString(),
        message,
        type,
        timestamp: new Date()
      }});
    },

    removeNotification: (id: string) => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    },
  };

  // Auto-reconnect on app load
  useEffect(() => {
    const autoReconnect = async () => {
      const provider = localStorage.getItem('connected-wallet-provider');
      if (!provider) return;

      try {
        if (provider === 'keplr') {
          const reconnected = await keplrWallet.autoReconnect();
          if (reconnected) {
            const connection = keplrWallet.getConnection();
            if (connection) {
              // Reconnect to backend
              const wallet = await apiService.connectWallet({ 
                provider: 'keplr', 
                address: connection.address 
              });
              
              dispatch({ type: 'SET_WALLET', payload: wallet });
              dispatch({ type: 'SET_WALLET_CONNECTED', payload: true });
              
              console.log('Auto-reconnected to Keplr wallet');
            }
          }
        } else if (provider === 'metamask') {
          const reconnected = await metamaskWallet.autoReconnect();
          if (reconnected) {
            const connection = metamaskWallet.getConnection();
            if (connection) {
              // Reconnect to backend
              const wallet = await apiService.connectWallet({ 
                provider: 'metamask', 
                address: connection.cosmosAddress 
              });
              
              dispatch({ type: 'SET_WALLET', payload: wallet });
              dispatch({ type: 'SET_WALLET_CONNECTED', payload: true });
              
              console.log('Auto-reconnected to MetaMask wallet');
            }
          }
        }
        // Add other wallet auto-reconnection here
      } catch (error) {
        console.error('Auto-reconnection failed:', error);
        // Clear invalid connection data
        localStorage.removeItem('connected-wallet-provider');
      }
    };

    autoReconnect();
  }, []);

  // Load initial data when wallet is connected
  useEffect(() => {
    if (state.isWalletConnected) {
      actions.loadUserData();
      actions.loadTransfers();
      actions.loadGroups();
      actions.loadPots();
      actions.loadVaults();
      actions.loadEscrows();
      actions.loadMarketData();
      actions.connectAIAgent();
    }
  }, [state.isWalletConnected]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (state.isWalletConnected) {
      const interval = setInterval(() => {
        actions.loadMarketData();
        actions.loadTransfers();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [state.isWalletConnected]);

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the context
export const useApp = (): {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    connectWallet: (provider: 'keplr' | 'leap' | 'metamask') => Promise<void>;
    disconnectWallet: () => Promise<void>;
    loadUserData: () => Promise<void>;
    loadTransfers: () => Promise<void>;
    loadGroups: () => Promise<void>;
    loadPots: () => Promise<void>;
    loadVaults: () => Promise<void>;
    loadEscrows: () => Promise<void>;
    loadMarketData: () => Promise<void>;
    createTransfer: (data: any) => Promise<void>;
    createGroup: (data: any) => Promise<void>;
    createPot: (data: any) => Promise<void>;
    createVault: (data: any) => Promise<void>;
    createEscrow: (data: any) => Promise<void>;
    connectAIAgent: () => Promise<void>;
    getAIRecommendations: () => Promise<void>;
    clearError: () => void;
    addNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  };
} => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Types
export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
}

// Extend Window interface for wallet providers
declare global {
  interface Window {
    keplr?: any;
    leap?: any;
    ethereum?: any;
  }
}
