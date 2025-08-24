/**
 * Pool command for Telegram Bot
 */

import { Context } from 'telegraf';
import { SeiMoneyBotSDK } from '../lib/sdk';
import { SessionManager } from '../lib/session';
import { logger } from '../lib/logger';

export class PoolCommand {
  private sdk: SeiMoneyBotSDK;
  private sessionManager: SessionManager;

  constructor(sdk: SeiMoneyBotSDK, sessionManager: SessionManager) {
    this.sdk = sdk;
    this.sessionManager = sessionManager;
  }

  /**
   * Handle /pool command
   */
  async handle(ctx: Context): Promise<void> {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) {
        await ctx.reply('❌ Unable to identify user');
        return;
      }

      // Get user session
      const session = await this.sessionManager.getUserSession(telegramId);
      if (!session?.isBound) {
        await ctx.reply(
          '❌ You need to bind your Sei wallet first!\n\n' +
          'Use /bind <your_sei_address> to connect your wallet.'
        );
        return;
      }

      const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
      const args = text.split(' ').slice(1);

      if (args.length === 0) {
        await this.showUsage(ctx);
        return;
      }

      const subcommand = args[0].toLowerCase();

      switch (subcommand) {
        case 'create':
          await this.createPool(ctx, args.slice(1));
          break;
        case 'contribute':
          await this.contributeToPool(ctx, args.slice(1));
          break;
        case 'distribute':
          await this.distributePool(ctx, args.slice(1));
          break;
        case 'status':
          await this.getPoolStatus(ctx, args.slice(1));
          break;
        case 'list':
          await this.listPools(ctx);
          break;
        default:
          await this.showUsage(ctx);
      }

    } catch (error) {
      logger.error('Pool command error', { error, userId: ctx.from?.id });
      await ctx.reply('❌ An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Create a new pool
   */
  private async createPool(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /pool create <target_amount> [memo] [expiry_hours]\n\n' +
        '**Examples:**\n' +
        '/pool create 100\n' +
        '/pool create 500 Team funding\n' +
        '/pool create 1000 Event budget 48'
      );
      return;
    }

    const targetAmount = parseFloat(args[0]);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      await ctx.reply('❌ Invalid target amount. Please provide a positive number.');
      return;
    }

    const memo = args[1] || 'Pool funding';
    const expiryHours = args[2] ? parseInt(args[2]) : 24;

    if (expiryHours && (isNaN(expiryHours) || expiryHours <= 0)) {
      await ctx.reply('❌ Invalid expiry hours. Please provide a positive number.');
      return;
    }

    // Convert to usei
    const targetUsei = Math.floor(targetAmount * 1000000).toString();
    const expiryTs = Math.floor(Date.now() / 1000) + (expiryHours * 3600);

    try {
      const result = await this.sdk.createPool(targetUsei, 'usei', memo, expiryTs);

      if (result.success) {
        await ctx.reply(
          `👥 **Pool Created Successfully!**\n\n` +
          `**Target:** ${targetAmount} SEI (${targetUsei} usei)\n` +
          `**Memo:** ${memo}\n` +
          `**Expires:** ${new Date(expiryTs * 1000).toLocaleString()}\n` +
          `**Transaction Hash:** \`${result.txHash}\`\n\n` +
          `Share this pool ID with contributors!`
        );

        logger.logTransaction(ctx.from!.id, 'pool_create', result.txHash!, true);
        logger.logUserActivity(ctx.from!.id, 'pool_created', {
          targetAmount: targetUsei,
          memo,
          expiryTs,
          txHash: result.txHash
        });
      } else {
        await ctx.reply(
          `❌ **Pool Creation Failed**\n\n` +
          `**Error:** ${result.error}\n\n` +
          `Please try again or contact support.`
        );

        logger.logTransaction(ctx.from!.id, 'pool_create', 'failed', false);
      }
    } catch (error) {
      logger.error('Create pool error', { error, userId: ctx.from!.id });
      await ctx.reply('❌ Failed to create pool. Please try again.');
    }
  }

  /**
   * Contribute to a pool
   */
  private async contributeToPool(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 2) {
      await ctx.reply(
        '❌ **Usage:** /pool contribute <pool_id> <amount>\n\n' +
        '**Examples:**\n' +
        '/pool contribute 123 10.5\n' +
        '/pool contribute 456 25'
      );
      return;
    }

    const poolId = parseInt(args[0]);
    if (isNaN(poolId)) {
      await ctx.reply('❌ Invalid pool ID. Please provide a valid number.');
      return;
    }

    const amount = parseFloat(args[1]);
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('❌ Invalid amount. Please provide a positive number.');
      return;
    }

    // Convert to usei
    const amountUsei = Math.floor(amount * 1000000).toString();

    try {
      const result = await this.sdk.contributeToPool(poolId, amountUsei, 'usei');

      if (result.success) {
        await ctx.reply(
          `💰 **Contribution Successful!**\n\n` +
          `**Pool ID:** #${poolId}\n` +
          `**Amount:** ${amount} SEI (${amountUsei} usei)\n` +
          `**Transaction Hash:** \`${result.txHash}\`\n\n` +
          `Thank you for your contribution!`
        );

        logger.logTransaction(ctx.from!.id, 'pool_contribute', result.txHash!, true);
        logger.logUserActivity(ctx.from!.id, 'pool_contributed', {
          poolId,
          amount: amountUsei,
          txHash: result.txHash
        });
      } else {
        await ctx.reply(
          `❌ **Contribution Failed**\n\n` +
          `**Error:** ${result.error}\n\n` +
          `Please try again or contact support.`
        );

        logger.logTransaction(ctx.from!.id, 'pool_contribute', 'failed', false);
      }
    } catch (error) {
      logger.error('Contribute to pool error', { error, userId: ctx.from!.id, poolId });
      await ctx.reply('❌ Failed to contribute to pool. Please try again.');
    }
  }

  /**
   * Distribute pool funds
   */
  private async distributePool(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /pool distribute <pool_id>\n\n' +
        '**Examples:**\n' +
        '/pool distribute 123\n' +
        '/pool distribute 456'
      );
      return;
    }

    const poolId = parseInt(args[0]);
    if (isNaN(poolId)) {
      await ctx.reply('❌ Invalid pool ID. Please provide a valid number.');
      return;
    }

    try {
      // This would require implementing distributePool in the SDK
      // For now, we'll show a message
      await ctx.reply(
        `🔄 **Pool Distribution**\n\n` +
        `Pool distribution functionality is coming soon!\n\n` +
        `Pool ID: #${poolId}\n` +
        `Status: Under development`
      );

      logger.logUserActivity(ctx.from!.id, 'pool_distribute_requested', { poolId });
    } catch (error) {
      logger.error('Distribute pool error', { error, userId: ctx.from!.id, poolId });
      await ctx.reply('❌ Failed to distribute pool. Please try again.');
    }
  }

  /**
   * Get pool status
   */
  private async getPoolStatus(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /pool status <pool_id>\n\n' +
        '**Examples:**\n' +
        '/pool status 123\n' +
        '/pool status 456'
      );
      return;
    }

    const poolId = parseInt(args[0]);
    if (isNaN(poolId)) {
      await ctx.reply('❌ Invalid pool ID. Please provide a valid number.');
      return;
    }

    try {
      // This would require implementing getPool in the SDK
      // For now, we'll show a message
      await ctx.reply(
        `📊 **Pool Status**\n\n` +
        `Pool status functionality is coming soon!\n\n` +
        `Pool ID: #${poolId}\n` +
        `Status: Under development`
      );

      logger.logUserActivity(ctx.from!.id, 'pool_status_requested', { poolId });
    } catch (error) {
      logger.error('Get pool status error', { error, userId: ctx.from!.id, poolId });
      await ctx.reply('❌ Failed to get pool status. Please try again.');
    }
  }

  /**
   * List pools
   */
  private async listPools(ctx: Context): Promise<void> {
    try {
      // This would require implementing listPools in the SDK
      // For now, we'll show a message
      await ctx.reply(
        `📋 **Pool Listing**\n\n` +
        `Pool listing functionality is coming soon!\n\n` +
        `You'll be able to see:\n` +
        `• Active pools\n` +
        `• Pool progress\n` +
        `• Contribution totals\n` +
        `• Expiry dates`
      );

      logger.logUserActivity(ctx.from!.id, 'pool_list_requested');
    } catch (error) {
      logger.error('List pools error', { error, userId: ctx.from!.id });
      await ctx.reply('❌ Failed to list pools. Please try again.');
    }
  }

  /**
   * Show pool usage
   */
  private async showUsage(ctx: Context): Promise<void> {
    const usage = 
      `👥 **Pool Command Usage**\n\n` +
      `**Create Pool:**\n` +
      `/pool create <target_amount> [memo] [expiry_hours]\n\n` +
      `**Contribute:**\n` +
      `/pool contribute <pool_id> <amount>\n\n` +
      `**Distribute:**\n` +
      `/pool distribute <pool_id>\n\n` +
      `**Status:**\n` +
      `/pool status <pool_id>\n\n` +
      `**List Pools:**\n` +
      `/pool list\n\n` +
      `**Examples:**\n` +
      `/pool create 100 Team funding\n` +
      `/pool contribute 123 25\n` +
      `/pool status 123`;

    await ctx.reply(usage, { parse_mode: 'Markdown' });
  }
}
