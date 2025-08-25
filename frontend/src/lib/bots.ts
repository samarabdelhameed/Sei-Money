// Bot Integration for SeiMoney
import { apiService } from './api';

// Bot Types
export interface BotCommand {
  id: string;
  name: string;
  description: string;
  usage: string;
  examples: string[];
  category: 'payment' | 'portfolio' | 'trading' | 'info' | 'admin';
  requiresAuth: boolean;
  cooldown: number; // seconds
}

export interface BotResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: Date;
}

export interface BotSession {
  id: string;
  userId: string;
  platform: 'discord' | 'telegram';
  channelId: string;
  isActive: boolean;
  lastActivity: Date;
  preferences: {
    notifications: boolean;
    language: string;
    timezone: string;
  };
}

export interface BotNotification {
  id: string;
  userId: string;
  platform: 'discord' | 'telegram';
  channelId: string;
  type: 'alert' | 'update' | 'reminder' | 'market';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  sent: boolean;
  sentAt?: Date;
  createdAt: Date;
}

// Bot Service Class
export class BotService {
  private baseURL: string;
  private isConnected: boolean = false;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || import.meta.env.VITE_BOT_SERVICE_URL || 'http://localhost:3003';
  }

  // Connect to bot service
  async connect(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          client: 'seimoney-frontend',
        }),
      });

      if (response.ok) {
        this.isConnected = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to connect to Bot Service:', error);
      return false;
    }
  }

  // Disconnect from bot service
  async disconnect(): Promise<void> {
    try {
      await fetch(`${this.baseURL}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error disconnecting from Bot Service:', error);
    }
    
    this.isConnected = false;
  }

  // Get available bot commands
  async getCommands(platform: 'discord' | 'telegram'): Promise<BotCommand[]> {
    if (!this.isConnected) {
      throw new Error('Bot Service not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/commands?platform=${platform}`);
      
      if (!response.ok) {
        throw new Error(`Bot Service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get bot commands: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Execute bot command
  async executeCommand(
    platform: 'discord' | 'telegram',
    command: string,
    args: string[],
    userId: string,
    channelId: string
  ): Promise<BotResponse> {
    if (!this.isConnected) {
      throw new Error('Bot Service not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          command,
          args,
          userId,
          channelId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Bot Service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to execute bot command: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Send notification via bot
  async sendNotification(notification: Omit<BotNotification, 'id' | 'createdAt'>): Promise<BotNotification> {
    if (!this.isConnected) {
      throw new Error('Bot Service not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...notification,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Bot Service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get bot sessions
  async getSessions(userId: string): Promise<BotSession[]> {
    if (!this.isConnected) {
      throw new Error('Bot Service not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/sessions?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Bot Service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get bot sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create bot session
  async createSession(session: Omit<BotSession, 'id' | 'lastActivity'>): Promise<BotSession> {
    if (!this.isConnected) {
      throw new Error('Bot Service not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...session,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Bot Service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to create bot session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update bot session
  async updateSession(sessionId: string, updates: Partial<BotSession>): Promise<BotSession> {
    if (!this.isConnected) {
      throw new Error('Bot Service not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Bot Service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to update bot session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get bot status
  async getBotStatus(platform: 'discord' | 'telegram'): Promise<{
    isOnline: boolean;
    uptime: number;
    commandsProcessed: number;
    usersServed: number;
    lastActivity: Date;
  }> {
    if (!this.isConnected) {
      throw new Error('Bot Service not connected');
    }

    try {
      const response = await fetch(`${this.baseURL}/status?platform=${platform}`);
      
      if (!response.ok) {
        throw new Error(`Bot Service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get bot status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check connection status
  isServiceConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const botService = new BotService();

// Mock Bot Service for development/testing
export class MockBotService extends BotService {
  constructor() {
    super();
  }

  async connect(): Promise<boolean> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 500));
    this.isConnected = true;
    return true;
  }

  async getCommands(platform: 'discord' | 'telegram'): Promise<BotCommand[]> {
    return [
      {
        id: '1',
        name: 'balance',
        description: 'Check your wallet balance',
        usage: '!balance [address]',
        examples: ['!balance', '!balance sei1abc...'],
        category: 'info',
        requiresAuth: true,
        cooldown: 30,
      },
      {
        id: '2',
        name: 'transfer',
        description: 'Send SEI tokens to another address',
        usage: '!transfer <recipient> <amount> [remark]',
        examples: ['!transfer sei1def... 100', '!transfer sei1def... 100 "Payment for services"'],
        category: 'payment',
        requiresAuth: true,
        cooldown: 60,
      },
      {
        id: '3',
        name: 'portfolio',
        description: 'View your portfolio summary',
        usage: '!portfolio',
        examples: ['!portfolio'],
        category: 'portfolio',
        requiresAuth: true,
        cooldown: 120,
      },
      {
        id: '4',
        name: 'price',
        description: 'Get current price of SEI',
        usage: '!price [currency]',
        examples: ['!price', '!price usd', '!price eur'],
        category: 'info',
        requiresAuth: false,
        cooldown: 10,
      },
      {
        id: '5',
        name: 'help',
        description: 'Show available commands',
        usage: '!help [category]',
        examples: ['!help', '!help payment', '!help portfolio'],
        category: 'info',
        requiresAuth: false,
        cooldown: 0,
      },
    ];
  }

  async executeCommand(
    platform: 'discord' | 'telegram',
    command: string,
    args: string[],
    userId: string,
    channelId: string
  ): Promise<BotResponse> {
    // Simulate command execution
    await new Promise(resolve => setTimeout(resolve, 1000));

    switch (command) {
      case 'balance':
        return {
          success: true,
          message: `💰 **Wallet Balance**\n\n**Address:** sei1abc...xyz\n**Balance:** 1,234.56 SEI\n**USD Value:** $2,469.12`,
          data: {
            address: 'sei1abc...xyz',
            balance: '1234.56',
            usdValue: 2469.12,
          },
          timestamp: new Date(),
        };

      case 'transfer':
        if (args.length < 2) {
          return {
            success: false,
            message: '❌ **Error:** Invalid usage. Use: `!transfer <recipient> <amount> [remark]`',
            error: 'Invalid arguments',
            timestamp: new Date(),
          };
        }
        return {
          success: true,
          message: `✅ **Transfer Initiated**\n\n**To:** ${args[0]}\n**Amount:** ${args[1]} SEI\n**Remark:** ${args[2] || 'No remark'}\n\nTransaction will be processed shortly.`,
          data: {
            recipient: args[0],
            amount: args[1],
            remark: args[2] || '',
          },
          timestamp: new Date(),
        };

      case 'portfolio':
        return {
          success: true,
          message: `📊 **Portfolio Summary**\n\n**Total Value:** 1,234.56 SEI ($2,469.12)\n**24h Change:** +5.67% 📈\n**Holdings:** 3 assets\n**Risk Level:** Medium`,
          data: {
            totalValue: 1234.56,
            usdValue: 2469.12,
            change24h: 5.67,
            holdings: 3,
            riskLevel: 'Medium',
          },
          timestamp: new Date(),
        };

      case 'price':
        return {
          success: true,
          message: `💱 **SEI Price**\n\n**Current Price:** $2.00 USD\n**24h Change:** +3.45% 📈\n**Market Cap:** $1.2B\n**Volume:** $45.6M`,
          data: {
            price: 2.00,
            change24h: 3.45,
            marketCap: 1200000000,
            volume: 45600000,
          },
          timestamp: new Date(),
        };

      case 'help':
        return {
          success: true,
          message: `🤖 **Available Commands**\n\n**Info:** !balance, !price, !help\n**Payment:** !transfer\n**Portfolio:** !portfolio\n\nUse \`!help <category>\` for detailed help.`,
          data: {
            commands: await this.getCommands(platform),
          },
          timestamp: new Date(),
        };

      default:
        return {
          success: false,
          message: `❌ **Unknown Command**\n\nCommand \`${command}\` not found. Use \`!help\` to see available commands.`,
          error: 'Unknown command',
          timestamp: new Date(),
        };
    }
  }

  async getBotStatus(platform: 'discord' | 'telegram'): Promise<{
    isOnline: boolean;
    uptime: number;
    commandsProcessed: number;
    usersServed: number;
    lastActivity: Date;
  }> {
    return {
      isOnline: true,
      uptime: 86400, // 24 hours in seconds
      commandsProcessed: 1234,
      usersServed: 567,
      lastActivity: new Date(),
    };
  }
}

// Export mock service for development
export const mockBotService = new MockBotService();
