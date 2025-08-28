import { realDataService, RealSavingsPot } from './real-data-service';
import { blockchainService } from './blockchain-service';

export interface AutoSaveConfig {
  potId: string;
  enabled: boolean;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextSaveDate: Date;
  lastSaveDate?: Date;
  minBalance: number; // Minimum balance to maintain in wallet
}

export interface AutoSaveTransaction {
  id: string;
  potId: string;
  amount: number;
  scheduledDate: Date;
  executedDate?: Date;
  status: 'scheduled' | 'executed' | 'failed' | 'cancelled';
  txHash?: string;
  error?: string;
}

class AutoSaveServiceImpl {
  private configs: Map<string, AutoSaveConfig> = new Map();
  private scheduledTransactions: Map<string, AutoSaveTransaction> = new Map();
  private scheduler: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.loadConfigs();
    this.startScheduler();
  }

  // Configure auto-save for a pot
  async configureAutoSave(config: {
    potId: string;
    enabled: boolean;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    minBalance?: number;
  }): Promise<void> {
    const autoSaveConfig: AutoSaveConfig = {
      potId: config.potId,
      enabled: config.enabled,
      amount: config.amount,
      frequency: config.frequency,
      nextSaveDate: this.calculateNextSaveDate(config.frequency),
      minBalance: config.minBalance || 10, // Default minimum balance of 10 SEI
    };

    this.configs.set(config.potId, autoSaveConfig);
    this.saveConfigs();

    if (config.enabled) {
      await this.scheduleNextSave(config.potId);
    }
  }

  // Get auto-save configuration for a pot
  getAutoSaveConfig(potId: string): AutoSaveConfig | null {
    return this.configs.get(potId) || null;
  }

  // Get all auto-save configurations for a user
  getUserAutoSaveConfigs(userAddress: string): AutoSaveConfig[] {
    // In a real implementation, we'd filter by user address
    return Array.from(this.configs.values());
  }

  // Enable/disable auto-save for a pot
  async toggleAutoSave(potId: string, enabled: boolean): Promise<void> {
    const config = this.configs.get(potId);
    if (config) {
      config.enabled = enabled;
      this.configs.set(potId, config);
      this.saveConfigs();

      if (enabled) {
        await this.scheduleNextSave(potId);
      } else {
        this.cancelScheduledSave(potId);
      }
    }
  }

  // Execute auto-save for a specific pot
  async executeAutoSave(potId: string, userAddress: string): Promise<AutoSaveTransaction> {
    const config = this.configs.get(potId);
    if (!config || !config.enabled) {
      throw new Error('Auto-save not configured or disabled for this pot');
    }

    const transactionId = `autosave_${potId}_${Date.now()}`;
    const transaction: AutoSaveTransaction = {
      id: transactionId,
      potId,
      amount: config.amount,
      scheduledDate: new Date(),
      status: 'scheduled'
    };

    try {
      // Check wallet balance
      const balance = await realDataService.getWalletBalance(userAddress);
      const requiredAmount = config.amount + config.minBalance;

      if (balance < requiredAmount) {
        transaction.status = 'failed';
        transaction.error = `Insufficient balance. Required: ${requiredAmount} SEI, Available: ${balance} SEI`;
        this.scheduledTransactions.set(transactionId, transaction);
        return transaction;
      }

      // Execute the deposit
      const depositResult = await realDataService.depositToPot(potId, config.amount);
      
      transaction.status = 'executed';
      transaction.executedDate = new Date();
      transaction.txHash = depositResult.txHash;

      // Update config with last save date and schedule next save
      config.lastSaveDate = new Date();
      config.nextSaveDate = this.calculateNextSaveDate(config.frequency);
      this.configs.set(potId, config);
      this.saveConfigs();

      // Schedule next auto-save
      await this.scheduleNextSave(potId);

    } catch (error) {
      transaction.status = 'failed';
      transaction.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('Auto-save execution failed:', error);
    }

    this.scheduledTransactions.set(transactionId, transaction);
    return transaction;
  }

  // Get auto-save transaction history
  getAutoSaveHistory(potId?: string): AutoSaveTransaction[] {
    const transactions = Array.from(this.scheduledTransactions.values());
    return potId 
      ? transactions.filter(tx => tx.potId === potId)
      : transactions;
  }

  // Start the auto-save scheduler
  private startScheduler(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.scheduler = setInterval(async () => {
      await this.checkAndExecuteScheduledSaves();
    }, 60000); // Check every minute

    console.log('Auto-save scheduler started');
  }

  // Stop the auto-save scheduler
  stopScheduler(): void {
    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
    this.isRunning = false;
    console.log('Auto-save scheduler stopped');
  }

  // Check for and execute scheduled auto-saves
  private async checkAndExecuteScheduledSaves(): Promise<void> {
    const now = new Date();
    
    for (const [potId, config] of this.configs.entries()) {
      if (config.enabled && config.nextSaveDate <= now) {
        try {
          // In a real implementation, we'd get the user address from the pot owner
          const userAddress = 'current_user_address'; // This would come from the wallet context
          await this.executeAutoSave(potId, userAddress);
          console.log(`Auto-save executed for pot ${potId}`);
        } catch (error) {
          console.error(`Failed to execute auto-save for pot ${potId}:`, error);
        }
      }
    }
  }

  // Schedule next auto-save for a pot
  private async scheduleNextSave(potId: string): Promise<void> {
    const config = this.configs.get(potId);
    if (!config || !config.enabled) return;

    // The next save date is already calculated in the config
    console.log(`Next auto-save for pot ${potId} scheduled for ${config.nextSaveDate}`);
  }

  // Cancel scheduled auto-save for a pot
  private cancelScheduledSave(potId: string): void {
    // Remove any pending transactions for this pot
    for (const [txId, tx] of this.scheduledTransactions.entries()) {
      if (tx.potId === potId && tx.status === 'scheduled') {
        tx.status = 'cancelled';
        this.scheduledTransactions.set(txId, tx);
      }
    }
    console.log(`Auto-save cancelled for pot ${potId}`);
  }

  // Calculate next save date based on frequency
  private calculateNextSaveDate(frequency: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    const nextDate = new Date(now);

    switch (frequency) {
      case 'daily':
        nextDate.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(now.getMonth() + 1);
        break;
    }

    return nextDate;
  }

  // Load configurations from localStorage
  private loadConfigs(): void {
    try {
      const saved = localStorage.getItem('autoSaveConfigs');
      if (saved) {
        const configs = JSON.parse(saved);
        for (const [potId, config] of Object.entries(configs)) {
          // Convert date strings back to Date objects
          const configObj = config as any;
          configObj.nextSaveDate = new Date(configObj.nextSaveDate);
          if (configObj.lastSaveDate) {
            configObj.lastSaveDate = new Date(configObj.lastSaveDate);
          }
          this.configs.set(potId, configObj);
        }
      }
    } catch (error) {
      console.error('Failed to load auto-save configs:', error);
    }
  }

  // Save configurations to localStorage
  private saveConfigs(): void {
    try {
      const configsObj = Object.fromEntries(this.configs.entries());
      localStorage.setItem('autoSaveConfigs', JSON.stringify(configsObj));
    } catch (error) {
      console.error('Failed to save auto-save configs:', error);
    }
  }

  // Get auto-save statistics
  getAutoSaveStats(): {
    totalConfigs: number;
    activeConfigs: number;
    totalSaved: number;
    successfulSaves: number;
    failedSaves: number;
  } {
    const totalConfigs = this.configs.size;
    const activeConfigs = Array.from(this.configs.values()).filter(c => c.enabled).length;
    
    const transactions = Array.from(this.scheduledTransactions.values());
    const successfulSaves = transactions.filter(tx => tx.status === 'executed').length;
    const failedSaves = transactions.filter(tx => tx.status === 'failed').length;
    const totalSaved = transactions
      .filter(tx => tx.status === 'executed')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      totalConfigs,
      activeConfigs,
      totalSaved,
      successfulSaves,
      failedSaves
    };
  }
}

export const autoSaveService = new AutoSaveServiceImpl();
export default autoSaveService;
