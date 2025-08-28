import { ApiResponse } from '../../types';
import { webSocketService } from './websocket-service';
import { blockchainService } from './blockchain-service';

// Notification Types
export interface RealTimeNotification {
  id: string;
  type: 'transaction' | 'balance' | 'contract' | 'deadline' | 'ai_recommendation' | 'system';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: number;
  read: boolean;
  actionable: boolean;
  actions?: NotificationAction[];
  expiresAt?: number;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link' | 'dismiss';
  action: string;
  data?: any;
}

export interface NotificationSubscription {
  id: string;
  type: 'transaction' | 'balance' | 'contract' | 'deadline' | 'ai_recommendation';
  address?: string;
  contractAddress?: string;
  txHash?: string;
  callback: (notification: RealTimeNotification) => void;
  filters?: NotificationFilter[];
}

export interface NotificationFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface NotificationConfig {
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableInAppNotifications: boolean;
  enableSoundAlerts: boolean;
  maxNotifications: number;
  autoMarkReadAfter: number; // milliseconds
  priorities: {
    transaction: 'medium';
    balance: 'low';
    contract: 'high';
    deadline: 'high';
    ai_recommendation: 'medium';
    system: 'urgent';
  };
}

export interface NotificationService {
  // Core notification operations
  createNotification(notification: Omit<RealTimeNotification, 'id' | 'timestamp' | 'read'>): string;
  getNotifications(limit?: number, offset?: number): RealTimeNotification[];
  getUnreadNotifications(): RealTimeNotification[];
  markAsRead(notificationId: string): void;
  markAllAsRead(): void;
  deleteNotification(notificationId: string): void;
  clearAllNotifications(): void;
  
  // Subscription management
  subscribeToTransactionUpdates(txHash: string, callback: (notification: RealTimeNotification) => void): string;
  subscribeToBalanceChanges(address: string, callback: (notification: RealTimeNotification) => void): string;
  subscribeToContractEvents(contractAddress: string, callback: (notification: RealTimeNotification) => void): string;
  subscribeToDeadlineReminders(callback: (notification: RealTimeNotification) => void): string;
  subscribeToAIRecommendations(callback: (notification: RealTimeNotification) => void): string;
  
  unsubscribe(subscriptionId: string): void;
  unsubscribeAll(): void;
  
  // Blockchain event monitoring
  startTransactionMonitoring(txHash: string): void;
  startBalanceMonitoring(address: string): void;
  startContractMonitoring(contractAddress: string): void;
  
  // Deadline and reminder system
  scheduleDeadlineReminder(deadline: Date, title: string, message: string, data?: any): string;
  cancelDeadlineReminder(reminderId: string): void;
  
  // AI recommendation notifications
  notifyAIRecommendation(recommendation: any): void;
  
  // Configuration
  updateConfig(config: Partial<NotificationConfig>): void;
  getConfig(): NotificationConfig;
  
  // Permission management
  requestNotificationPermission(): Promise<boolean>;
  hasNotificationPermission(): boolean;
  
  // Statistics
  getNotificationStats(): {
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  };
}

class NotificationServiceImpl implements NotificationService {
  private notifications: RealTimeNotification[] = [];
  private subscriptions: Map<string, NotificationSubscription> = new Map();
  private deadlineReminders: Map<string, NodeJS.Timeout> = new Map();
  private wsSubscriptions: string[] = [];

  private config: NotificationConfig = {
    enablePushNotifications: true,
    enableEmailNotifications: false,
    enableInAppNotifications: true,
    enableSoundAlerts: true,
    maxNotifications: 100,
    autoMarkReadAfter: 300000, // 5 minutes
    priorities: {
      transaction: 'medium',
      balance: 'low',
      contract: 'high',
      deadline: 'high',
      ai_recommendation: 'medium',
      system: 'urgent'
    }
  };

  constructor() {
    this.initializeWebSocketListeners();
    this.startAutoCleanup();
  }

  createNotification(notification: Omit<RealTimeNotification, 'id' | 'timestamp' | 'read'>): string {
    const id = this.generateNotificationId();
    
    const newNotification: RealTimeNotification = {
      ...notification,
      id,
      timestamp: Date.now(),
      read: false
    };

    this.notifications.unshift(newNotification);

    // Limit notifications
    if (this.notifications.length > this.config.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.config.maxNotifications);
    }

    // Show notification based on config
    this.displayNotification(newNotification);

    // Auto-mark as read after configured time
    if (this.config.autoMarkReadAfter > 0) {
      setTimeout(() => {
        this.markAsRead(id);
      }, this.config.autoMarkReadAfter);
    }

    return id;
  }

  getNotifications(limit = 50, offset = 0): RealTimeNotification[] {
    return this.notifications.slice(offset, offset + limit);
  }

  getUnreadNotifications(): RealTimeNotification[] {
    return this.notifications.filter(n => !n.read);
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
  }

  clearAllNotifications(): void {
    this.notifications = [];
  }

  subscribeToTransactionUpdates(txHash: string, callback: (notification: RealTimeNotification) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: NotificationSubscription = {
      id: subscriptionId,
      type: 'transaction',
      txHash,
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.startTransactionMonitoring(txHash);

    return subscriptionId;
  }

  subscribeToBalanceChanges(address: string, callback: (notification: RealTimeNotification) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: NotificationSubscription = {
      id: subscriptionId,
      type: 'balance',
      address,
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.startBalanceMonitoring(address);

    return subscriptionId;
  }

  subscribeToContractEvents(contractAddress: string, callback: (notification: RealTimeNotification) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: NotificationSubscription = {
      id: subscriptionId,
      type: 'contract',
      contractAddress,
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.startContractMonitoring(contractAddress);

    return subscriptionId;
  }

  subscribeToDeadlineReminders(callback: (notification: RealTimeNotification) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: NotificationSubscription = {
      id: subscriptionId,
      type: 'deadline',
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);

    return subscriptionId;
  }

  subscribeToAIRecommendations(callback: (notification: RealTimeNotification) => void): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: NotificationSubscription = {
      id: subscriptionId,
      type: 'ai_recommendation',
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);

    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  unsubscribeAll(): void {
    this.subscriptions.clear();
    
    // Unsubscribe from WebSocket events
    for (const wsSubscriptionId of this.wsSubscriptions) {
      webSocketService.unsubscribe(wsSubscriptionId);
    }
    this.wsSubscriptions = [];
  }

  startTransactionMonitoring(txHash: string): void {
    // Subscribe to WebSocket for real-time transaction updates
    const wsSubscriptionId = webSocketService.subscribeToTransaction(txHash, (event) => {
      const notification: RealTimeNotification = {
        id: this.generateNotificationId(),
        type: 'transaction',
        title: 'Transaction Update',
        message: `Transaction ${txHash.substring(0, 8)}... has been ${event.type === 'transaction_confirmed' ? 'confirmed' : 'updated'}`,
        data: { txHash, event },
        priority: 'medium',
        timestamp: Date.now(),
        read: false,
        actionable: true,
        actions: [{
          id: 'view_tx',
          label: 'View Transaction',
          type: 'link',
          action: `/transaction/${txHash}`
        }]
      };

      this.createNotification(notification);
      this.notifySubscribers('transaction', notification, { txHash });
    });

    this.wsSubscriptions.push(wsSubscriptionId);
  }

  startBalanceMonitoring(address: string): void {
    // Subscribe to WebSocket for real-time balance changes
    const wsSubscriptionId = webSocketService.subscribeToBalance(address, (event) => {
      if (event.type === 'balance_change') {
        const amount = event.data.amount || 0;
        const isIncoming = event.data.recipient === address;
        
        const notification: RealTimeNotification = {
          id: this.generateNotificationId(),
          type: 'balance',
          title: isIncoming ? 'Funds Received' : 'Funds Sent',
          message: `${isIncoming ? 'Received' : 'Sent'} ${amount} SEI`,
          data: { address, amount, isIncoming, event },
          priority: amount > 1000 ? 'high' : 'low',
          timestamp: Date.now(),
          read: false,
          actionable: true,
          actions: [{
            id: 'view_balance',
            label: 'View Balance',
            type: 'link',
            action: '/wallet'
          }]
        };

        this.createNotification(notification);
        this.notifySubscribers('balance', notification, { address });
      }
    });

    this.wsSubscriptions.push(wsSubscriptionId);
  }

  startContractMonitoring(contractAddress: string): void {
    // Subscribe to WebSocket for real-time contract events
    const wsSubscriptionId = webSocketService.subscribeToContract(contractAddress, (event) => {
      if (event.type === 'contract_event') {
        const notification: RealTimeNotification = {
          id: this.generateNotificationId(),
          type: 'contract',
          title: 'Contract Event',
          message: `Contract ${contractAddress.substring(0, 8)}... triggered an event`,
          data: { contractAddress, event },
          priority: 'high',
          timestamp: Date.now(),
          read: false,
          actionable: true,
          actions: [{
            id: 'view_contract',
            label: 'View Contract',
            type: 'link',
            action: `/contract/${contractAddress}`
          }]
        };

        this.createNotification(notification);
        this.notifySubscribers('contract', notification, { contractAddress });
      }
    });

    this.wsSubscriptions.push(wsSubscriptionId);
  }

  scheduleDeadlineReminder(deadline: Date, title: string, message: string, data?: any): string {
    const reminderId = this.generateNotificationId();
    const now = Date.now();
    const deadlineTime = deadline.getTime();
    
    // Schedule reminders at different intervals
    const intervals = [
      { time: deadlineTime - (24 * 60 * 60 * 1000), label: '24 hours' }, // 24 hours before
      { time: deadlineTime - (60 * 60 * 1000), label: '1 hour' },        // 1 hour before
      { time: deadlineTime - (15 * 60 * 1000), label: '15 minutes' },    // 15 minutes before
      { time: deadlineTime, label: 'now' }                               // At deadline
    ];

    intervals.forEach((interval, index) => {
      if (interval.time > now) {
        const timeout = setTimeout(() => {
          const notification: RealTimeNotification = {
            id: this.generateNotificationId(),
            type: 'deadline',
            title: `Deadline Reminder: ${title}`,
            message: interval.label === 'now' 
              ? `Deadline reached: ${message}`
              : `Deadline in ${interval.label}: ${message}`,
            data: { ...data, deadline, interval: interval.label },
            priority: interval.label === 'now' ? 'urgent' : 'high',
            timestamp: Date.now(),
            read: false,
            actionable: true,
            expiresAt: deadlineTime + (60 * 60 * 1000) // Expire 1 hour after deadline
          };

          this.createNotification(notification);
          this.notifySubscribers('deadline', notification);
        }, interval.time - now);

        this.deadlineReminders.set(`${reminderId}_${index}`, timeout);
      }
    });

    return reminderId;
  }

  cancelDeadlineReminder(reminderId: string): void {
    // Cancel all timeouts for this reminder
    for (const [key, timeout] of this.deadlineReminders.entries()) {
      if (key.startsWith(reminderId)) {
        clearTimeout(timeout);
        this.deadlineReminders.delete(key);
      }
    }
  }

  notifyAIRecommendation(recommendation: any): void {
    const notification: RealTimeNotification = {
      id: this.generateNotificationId(),
      type: 'ai_recommendation',
      title: 'AI Recommendation',
      message: recommendation.summary || 'New AI recommendation available',
      data: recommendation,
      priority: recommendation.priority || 'medium',
      timestamp: Date.now(),
      read: false,
      actionable: true,
      actions: [{
        id: 'view_recommendation',
        label: 'View Details',
        type: 'link',
        action: '/ai-recommendations'
      }, {
        id: 'execute_recommendation',
        label: 'Execute',
        type: 'button',
        action: 'execute_ai_recommendation',
        data: recommendation
      }]
    };

    this.createNotification(notification);
    this.notifySubscribers('ai_recommendation', notification);
  }

  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  hasNotificationPermission(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  getNotificationStats() {
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    this.notifications.forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
      byPriority[notification.priority] = (byPriority[notification.priority] || 0) + 1;
    });

    return {
      total: this.notifications.length,
      unread: this.getUnreadNotifications().length,
      byType,
      byPriority
    };
  }

  // Private helper methods
  private initializeWebSocketListeners(): void {
    // Initialize WebSocket connection for real-time updates
    webSocketService.connect().catch(error => {
      console.error('Failed to connect to WebSocket for notifications:', error);
    });
  }

  private startAutoCleanup(): void {
    // Clean up expired notifications every hour
    setInterval(() => {
      const now = Date.now();
      this.notifications = this.notifications.filter(notification => {
        return !notification.expiresAt || notification.expiresAt > now;
      });
    }, 60 * 60 * 1000); // 1 hour
  }

  private displayNotification(notification: RealTimeNotification): void {
    // In-app notification (always shown)
    if (this.config.enableInAppNotifications) {
      this.showInAppNotification(notification);
    }

    // Browser push notification
    if (this.config.enablePushNotifications && this.hasNotificationPermission()) {
      this.showPushNotification(notification);
    }

    // Sound alert
    if (this.config.enableSoundAlerts && notification.priority === 'urgent') {
      this.playNotificationSound();
    }
  }

  private showInAppNotification(notification: RealTimeNotification): void {
    // This would integrate with your UI notification system
    console.log('In-app notification:', notification);
  }

  private showPushNotification(notification: RealTimeNotification): void {
    if (this.hasNotificationPermission()) {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent'
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        
        // Handle notification click action
        if (notification.actions && notification.actions.length > 0) {
          const primaryAction = notification.actions[0];
          if (primaryAction.type === 'link') {
            window.location.href = primaryAction.action;
          }
        }
      };
    }
  }

  private playNotificationSound(): void {
    // Play notification sound
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(error => {
        console.error('Failed to play notification sound:', error);
      });
    } catch (error) {
      console.error('Notification sound not available:', error);
    }
  }

  private notifySubscribers(type: string, notification: RealTimeNotification, context?: any): void {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.type === type) {
        // Check if subscription matches context
        let matches = true;
        
        if (context) {
          if (subscription.address && context.address !== subscription.address) {
            matches = false;
          }
          if (subscription.contractAddress && context.contractAddress !== subscription.contractAddress) {
            matches = false;
          }
          if (subscription.txHash && context.txHash !== subscription.txHash) {
            matches = false;
          }
        }

        if (matches) {
          try {
            subscription.callback(notification);
          } catch (error) {
            console.error('Error in notification subscription callback:', error);
          }
        }
      }
    }
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const notificationService = new NotificationServiceImpl();
export default notificationService;