import WebSocket from 'ws';
import { PrismaClient } from '@prisma/client';
import { config } from '../../config';
import { indexerLogger } from '../../lib/logger';
import { EventProcessor } from './eventProcessor';
import { HeightTracker } from './heightTracker';

export interface IndexerConfig {
  rpcUrl: string;
  contracts: string[];
  batchSize: number;
  retryDelay: number;
  maxRetries: number;
}

export class BlockchainIndexer {
  private ws: WebSocket | null = null;
  private prisma: PrismaClient;
  private eventProcessor: EventProcessor;
  private heightTracker: HeightTracker;
  private isRunning = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor() {
    this.prisma = new PrismaClient();
    this.eventProcessor = new EventProcessor(this.prisma);
    this.heightTracker = new HeightTracker(this.prisma);
  }

  async start(): Promise<void> {
    try {
      indexerLogger.info('Starting blockchain indexer...');
      
      // Get last indexed height
      const lastHeight = await this.heightTracker.getLastIndexedHeight();
      indexerLogger.info(`Starting from height: ${lastHeight}`);

      // Connect to Tendermint WebSocket
      await this.connectWebSocket();
      
      this.isRunning = true;
      indexerLogger.info('Blockchain indexer started successfully');
    } catch (error) {
      indexerLogger.error('Failed to start blockchain indexer:', error);
      throw error;
    }
  }

  private async connectWebSocket(): Promise<void> {
    try {
      // Convert HTTP RPC URL to WebSocket URL
      const wsUrl = this.rpcUrl.replace('http', 'ws') + '/websocket';
      
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        indexerLogger.info('Connected to Tendermint WebSocket');
        this.reconnectAttempts = 0;
        
        // Subscribe to transaction events
        this.subscribeToEvents();
      });

      this.ws.on('message', async (data: Buffer) => {
        try {
          await this.handleMessage(data.toString());
        } catch (error) {
          indexerLogger.error('Error processing message:', error);
        }
      });

      this.ws.on('close', () => {
        indexerLogger.warn('WebSocket connection closed');
        this.handleReconnect();
      });

      this.ws.on('error', (error) => {
        indexerLogger.error('WebSocket error:', error);
        this.handleReconnect();
      });

    } catch (error) {
      indexerLogger.error('Failed to connect to WebSocket:', error);
      throw error;
    }
  }

  private subscribeToEvents(): void {
    if (!this.ws) return;

    // Subscribe to transaction events
    const subscribeMsg = {
      jsonrpc: '2.0',
      id: 1,
      method: 'subscribe',
      params: {
        query: "tm.event='Tx'"
      }
    };

    this.ws.send(JSON.stringify(subscribeMsg));
    indexerLogger.info('Subscribed to transaction events');
  }

  private async handleMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data);
      
      // Handle subscription confirmation
      if (message.result !== undefined) {
        indexerLogger.debug('Subscription confirmed:', message.result);
        return;
      }

      // Handle transaction events
      if (message.data && message.data.value && message.data.value.TxResult) {
        const txResult = message.data.value.TxResult;
        await this.processTransaction(txResult);
      }

    } catch (error) {
      indexerLogger.error('Error parsing WebSocket message:', error);
    }
  }

  private async processTransaction(txResult: any): Promise<void> {
    try {
      const { height, tx, result } = txResult;
      
      // Check if transaction was successful
      if (result.code !== 0) {
        return; // Skip failed transactions
      }

      // Process WASM events
      if (result.events) {
        for (const event of result.events) {
          if (event.type === 'wasm') {
            await this.processWasmEvent(event, height, tx);
          }
        }
      }

      // Update last indexed height
      await this.heightTracker.updateLastIndexedHeight(height);

    } catch (error) {
      indexerLogger.error('Error processing transaction:', error);
    }
  }

  private async processWasmEvent(event: any, height: number, tx: string): Promise<void> {
    try {
      const { contract_address, attributes } = event;
      
      // Check if this is one of our contracts
      if (!this.isOurContract(contract_address)) {
        return;
      }

      // Parse event attributes
      const eventData = this.parseEventAttributes(attributes);
      
      if (!eventData) {
        return;
      }

      // Process the event
      await this.eventProcessor.processEvent({
        contract: contract_address,
        eventType: eventData.type,
        data: eventData.data,
        txHash: tx,
        blockHeight: height,
        blockTime: new Date(),
      });

      indexerLogger.debug('Processed WASM event', {
        contract: contract_address,
        type: eventData.type,
        height,
      });

    } catch (error) {
      indexerLogger.error('Error processing WASM event:', error);
    }
  }

  private isOurContract(address: string): boolean {
    return Object.values(config.contracts).includes(address);
  }

  private parseEventAttributes(attributes: any[]): { type: string; data: any } | null {
    try {
      const eventMap = new Map();
      
      for (const attr of attributes) {
        if (attr.key && attr.value) {
          eventMap.set(attr.key, attr.value);
        }
      }

      // Determine event type based on attributes
      if (eventMap.has('action')) {
        const action = eventMap.get('action');
        const data: any = {};
        
        // Extract relevant data based on action
        for (const [key, value] of eventMap.entries()) {
          if (key !== 'action') {
            data[key] = value;
          }
        }

        return { type: action, data };
      }

      return null;
    } catch (error) {
      indexerLogger.error('Error parsing event attributes:', error);
      return null;
    }
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      indexerLogger.error('Max reconnection attempts reached, stopping indexer');
      await this.stop();
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    indexerLogger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(async () => {
      if (this.isRunning) {
        await this.connectWebSocket();
      }
    }, delay);
  }

  async stop(): Promise<void> {
    try {
      this.isRunning = false;
      
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      await this.prisma.$disconnect();
      indexerLogger.info('Blockchain indexer stopped');
    } catch (error) {
      indexerLogger.error('Error stopping indexer:', error);
    }
  }

  get rpcUrl(): string {
    return config.rpcUrl;
  }
}
