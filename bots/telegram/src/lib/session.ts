/**
 * User session management for Telegram Bot
 */

import { createClient } from 'redis';
import { UserSession, CommandContext } from '../types';

export class SessionManager {
  private redis: ReturnType<typeof createClient>;
  private readonly sessionPrefix = 'seimoney:session:';
  private readonly userPrefix = 'seimoney:user:';

  constructor(redisUrl: string) {
    this.redis = createClient({
      url: redisUrl
    });
    
    this.redis.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });
    
    this.redis.connect().catch(console.error);
  }

  /**
   * Get user session
   */
  async getUserSession(telegramId: number): Promise<UserSession | null> {
    try {
      const key = `${this.sessionPrefix}${telegramId}`;
      const session = await this.redis.get(key);
      
      if (!session) {
        return null;
      }

      return JSON.parse(session) as UserSession;
    } catch (error) {
      console.error('❌ Failed to get user session:', error);
      return null;
    }
  }

  /**
   * Create or update user session
   */
  async setUserSession(telegramId: number, session: Partial<UserSession>): Promise<void> {
    try {
      const key = `${this.sessionPrefix}${telegramId}`;
      const existingSession = await this.getUserSession(telegramId);
      
      const updatedSession: UserSession = {
        userId: session.userId || existingSession?.userId || `user_${telegramId}`,
        telegramId,
        seiAddress: session.seiAddress || existingSession?.seiAddress,
        username: session.username || existingSession?.username,
        isBound: session.isBound ?? existingSession?.isBound ?? false,
        lastActivity: new Date(),
        preferences: {
          notifications: session.preferences?.notifications ?? existingSession?.preferences?.notifications ?? true,
          language: session.preferences?.language ?? existingSession?.preferences?.language ?? 'en',
          timezone: session.preferences?.timezone ?? existingSession?.preferences?.timezone ?? 'UTC'
        }
      };

      await this.redis.setEx(key, 86400, JSON.stringify(updatedSession)); // 24 hours expiry
    } catch (error) {
      console.error('❌ Failed to set user session:', error);
    }
  }

  /**
   * Bind user's Sei address
   */
  async bindSeiAddress(telegramId: number, seiAddress: string): Promise<boolean> {
    try {
      const session = await this.getUserSession(telegramId);
      if (!session) {
        return false;
      }

      session.seiAddress = seiAddress;
      session.isBound = true;
      session.lastActivity = new Date();

      await this.setUserSession(telegramId, session);
      
      // Also store reverse mapping
      const userKey = `${this.userPrefix}${seiAddress}`;
      await this.redis.setEx(userKey, 86400, JSON.stringify({
        telegramId,
        username: session.username,
        boundAt: new Date()
      }));

      return true;
    } catch (error) {
      console.error('❌ Failed to bind Sei address:', error);
      return false;
    }
  }

  /**
   * Unbind user's Sei address
   */
  async unbindSeiAddress(telegramId: number): Promise<boolean> {
    try {
      const session = await this.getUserSession(telegramId);
      if (!session || !session.seiAddress) {
        return false;
      }

      session.seiAddress = undefined;
      session.isBound = false;
      session.lastActivity = new Date();

      await this.setUserSession(telegramId, session);
      
      // Remove reverse mapping
      const userKey = `${this.userPrefix}${session.seiAddress}`;
      await this.redis.del(userKey);

      return true;
    } catch (error) {
      console.error('❌ Failed to unbind Sei address:', error);
      return false;
    }
  }

  /**
   * Get user by Sei address
   */
  async getUserBySeiAddress(seiAddress: string): Promise<{ telegramId: number; username?: string } | null> {
    try {
      const key = `${this.userPrefix}${seiAddress}`;
      const user = await this.redis.get(key);
      
      if (!user) {
        return null;
      }

      return JSON.parse(user);
    } catch (error) {
      console.error('❌ Failed to get user by Sei address:', error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    telegramId: number, 
    preferences: Partial<UserSession['preferences']>
  ): Promise<boolean> {
    try {
      const session = await this.getUserSession(telegramId);
      if (!session) {
        return false;
      }

      session.preferences = { ...session.preferences, ...preferences };
      session.lastActivity = new Date();

      await this.setUserSession(telegramId, session);
      return true;
    } catch (error) {
      console.error('❌ Failed to update user preferences:', error);
      return false;
    }
  }

  /**
   * Get all active sessions
   */
  async getAllActiveSessions(): Promise<UserSession[]> {
    try {
      const keys = await this.redis.keys(`${this.sessionPrefix}*`);
      const sessions: UserSession[] = [];

      for (const key of keys) {
        const session = await this.redis.get(key);
        if (session) {
          sessions.push(JSON.parse(session));
        }
      }

      return sessions;
    } catch (error) {
      console.error('❌ Failed to get all active sessions:', error);
      return [];
    }
  }

  /**
   * Clean expired sessions
   */
  async cleanExpiredSessions(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.sessionPrefix}*`);
      let cleaned = 0;

      for (const key of keys) {
        const session = await this.redis.get(key);
        if (session) {
          const userSession = JSON.parse(session) as UserSession;
          const lastActivity = new Date(userSession.lastActivity);
          const now = new Date();
          
          // Remove sessions older than 7 days
          if (now.getTime() - lastActivity.getTime() > 7 * 24 * 60 * 60 * 1000) {
            await this.redis.del(key);
            cleaned++;
          }
        }
      }

      return cleaned;
    } catch (error) {
      console.error('❌ Failed to clean expired sessions:', error);
      return 0;
    }
  }

  /**
   * Create command context
   */
  async createCommandContext(
    telegramId: number, 
    command: string, 
    args: string[]
  ): Promise<CommandContext> {
    const session = await this.getUserSession(telegramId);
    
    return {
      userId: telegramId,
      username: session?.username,
      seiAddress: session?.seiAddress,
      isBound: session?.isBound ?? false,
      command: command as any,
      args,
      timestamp: new Date()
    };
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}
