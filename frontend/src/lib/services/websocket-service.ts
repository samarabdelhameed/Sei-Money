import { ApiResponse } from '../../types';

// WebSocket Event Types
export interface BlockchainEvent {
  type: 'balance_change' | 'transaction_confirmed' | 'contract_event' | 'block_update';
  address?: string;
  contractAddress?: string;
  data: any;
  timestamp: number;
  blockHeight?: number;
  txHash?: string;
}

export interface WebSocketSubscription {
  id: string;
  type: 'balance' | 'contract' | 'transaction' | 'block';
  address?: string;
  contractAddress?: string;
  callback: (event: BlockchainEvent) => void;
}

export interface WebSocketService {
  connect(): Promise<boolean>;
  disconnect(): void;
  isConnected(): boolean;
  
  // Subscription management
  subscribeToBalance(address: string, callback: (event: BlockchainEvent) => void): string;
  subscribeToContract(contractAddress: string, callback: (event: BlockchainEvent) => void): string;
  subscribeToTransaction(txHash: string, callback: (event: BlockchainEvent) => void): string;
  subscribeToBlocks(callback: (event: BlockchainEvent) => void): string;
  
  unsubscribe(subscriptionId: string): void;
  unsubscribeAll(): void;
  
  // Health monitoring
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' | 'error';
  getLastHeartbeat(): number;
}

class WebSocketServiceImpl implements WebSocketService {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, WebSocketSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeat = 0;
  private connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';

  // Sei WebSocket endpoints (would be configured based on network)
  private readonly wsEndpoints = [
    'wss://rpc.sei-apis.com/websocket',
    'wss://sei-rpc.polkachu.com/websocket',
    'wss://sei-rpc.brocha.in/websocket'
  ];
  private currentEndpointIndex = 0;

  async connect(): Promise<boolean> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return true;
    }

    this.connectionStatus = 'connecting';
    
    return new Promise((resolve, reject) => {
      try {
        const endpoint = this.wsEndpoints[this.currentEndpointIndex];
        this.ws = new WebSocket(endpoint);

        this.ws.onopen = () => {
          console.log('WebSocket connected to Sei blockchain');
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.resubscribeAll();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.connectionStatus = 'disconnected';
          this.stopHeartbeat();
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.connectionStatus = 'error';
          
          // Try next endpoint
          this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.wsEndpoints.length;
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else {
            reject(new Error('Failed to connect to WebSocket after multiple attempts'));
          }
        };

        // Connection timeout
        setTimeout(() => {
          if (this.connectionStatus === 'connecting') {
            this.ws?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        this.connectionStatus = 'error';
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
    this.connectionStatus = 'disconnected';
    this.subscriptions.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  subscribeToBalance(address: string, callback: (event: BlockchainEvent) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: WebSocketSubscription = {
      id: subscriptionId,
      type: 'balance',
      address,
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription message to WebSocket
    if (this.isConnected()) {
      this.sendSubscription({
        jsonrpc: '2.0',
        method: 'subscribe',
        params: {
          query: `tm.event='Tx' AND transfer.recipient='${address}'`
        },
        id: subscriptionId
      });
    }

    return subscriptionId;
  }

  subscribeToContract(contractAddress: string, callback: (event: BlockchainEvent) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: WebSocketSubscription = {
      id: subscriptionId,
      type: 'contract',
      contractAddress,
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription message to WebSocket
    if (this.isConnected()) {
      this.sendSubscription({
        jsonrpc: '2.0',
        method: 'subscribe',
        params: {
          query: `tm.event='Tx' AND wasm._contract_address='${contractAddress}'`
        },
        id: subscriptionId
      });
    }

    return subscriptionId;
  }

  subscribeToTransaction(txHash: string, callback: (event: BlockchainEvent) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: WebSocketSubscription = {
      id: subscriptionId,
      type: 'transaction',
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription message to WebSocket
    if (this.isConnected()) {
      this.sendSubscription({
        jsonrpc: '2.0',
        method: 'subscribe',
        params: {
          query: `tm.event='Tx' AND tx.hash='${txHash}'`
        },
        id: subscriptionId
      });
    }

    return subscriptionId;
  }

  subscribeToBlocks(callback: (event: BlockchainEvent) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: WebSocketSubscription = {
      id: subscriptionId,
      type: 'block',
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription message to WebSocket
    if (this.isConnected()) {
      this.sendSubscription({
        jsonrpc: '2.0',
        method: 'subscribe',
        params: {
          query: "tm.event='NewBlock'"
        },
        id: subscriptionId
      });
    }

    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription && this.isConnected()) {
      this.sendUnsubscription({
        jsonrpc: '2.0',
        method: 'unsubscribe',
        params: {
          id: subscriptionId
        },
        id: subscriptionId
      });
    }
    
    this.subscriptions.delete(subscriptionId);
  }

  unsubscribeAll(): void {
    for (const subscriptionId of this.subscriptions.keys()) {
      this.unsubscribe(subscriptionId);
    }
  }

  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' | 'error' {
    return this.connectionStatus;
  }

  getLastHeartbeat(): number {
    return this.lastHeartbeat;
  }

  // Private methods
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      // Handle heartbeat/ping responses
      if (message.id === 'heartbeat') {
        this.lastHeartbeat = Date.now();
        return;
      }

      // Handle subscription events
      if (message.result && message.result.events) {
        this.processBlockchainEvent(message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private processBlockchainEvent(message: any): void {
    const events = message.result.events;
    const txResult = message.result.data?.value?.TxResult;
    
    // Process different event types
    for (const [eventType, eventData] of Object.entries(events)) {
      switch (eventType) {
        case 'transfer':
          this.handleTransferEvent(eventData, txResult);
          break;
        case 'wasm':
          this.handleContractEvent(eventData, txResult);
          break;
        case 'tm.event':
          if (eventData === 'NewBlock') {
            this.handleBlockEvent(message.result.data);
          }
          break;
      }
    }
  }

  private handleTransferEvent(eventData: any, txResult: any): void {
    const recipient = eventData.recipient?.[0];
    const amount = eventData.amount?.[0];
    
    if (recipient) {
      // Find subscriptions for this address
      for (const subscription of this.subscriptions.values()) {
        if (subscription.type === 'balance' && subscription.address === recipient) {
          const event: BlockchainEvent = {
            type: 'balance_change',
            address: recipient,
            data: {
              amount,
              sender: eventData.sender?.[0],
              recipient
            },
            timestamp: Date.now(),
            txHash: txResult?.hash
          };
          
          subscription.callback(event);
        }
      }
    }
  }

  private handleContractEvent(eventData: any, txResult: any): void {
    const contractAddress = eventData._contract_address?.[0];
    
    if (contractAddress) {
      // Find subscriptions for this contract
      for (const subscription of this.subscriptions.values()) {
        if (subscription.type === 'contract' && subscription.contractAddress === contractAddress) {
          const event: BlockchainEvent = {
            type: 'contract_event',
            contractAddress,
            data: eventData,
            timestamp: Date.now(),
            txHash: txResult?.hash
          };
          
          subscription.callback(event);
        }
      }
    }
  }

  private handleBlockEvent(blockData: any): void {
    // Notify all block subscribers
    for (const subscription of this.subscriptions.values()) {
      if (subscription.type === 'block') {
        const event: BlockchainEvent = {
          type: 'block_update',
          data: blockData,
          timestamp: Date.now(),
          blockHeight: blockData?.value?.block?.header?.height
        };
        
        subscription.callback(event);
      }
    }
  }

  private sendSubscription(message: any): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message));
    }
  }

  private sendUnsubscription(message: any): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message));
    }
  }

  private resubscribeAll(): void {
    // Re-send all active subscriptions after reconnection
    for (const subscription of this.subscriptions.values()) {
      let query = '';
      
      switch (subscription.type) {
        case 'balance':
          query = `tm.event='Tx' AND transfer.recipient='${subscription.address}'`;
          break;
        case 'contract':
          query = `tm.event='Tx' AND wasm._contract_address='${subscription.contractAddress}'`;
          break;
        case 'block':
          query = "tm.event='NewBlock'";
          break;
      }

      if (query) {
        this.sendSubscription({
          jsonrpc: '2.0',
          method: 'subscribe',
          params: { query },
          id: subscription.id
        });
      }
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.ws!.send(JSON.stringify({
          jsonrpc: '2.0',
          method: 'ping',
          id: 'heartbeat'
        }));
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const webSocketService = new WebSocketServiceImpl();
export default webSocketService;