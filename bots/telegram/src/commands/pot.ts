/**
 * Pot command for Telegram Bot
 */

import { Context } from 'telegraf';
import { SeiMoneyBotSDK } from '../lib/sdk';
import { SessionManager } from '../lib/session';
import { logger } from '../lib/logger';

export class PotCommand {
  private sdk: SeiMoneyBotSDK;
  private sessionManager: SessionManager;

  constructor(sdk: SeiMoneyBotSDK, sessionManager: SessionManager) {
    this.sdk = sdk;
    this.sessionManager = sessionManager;
  }

  /**
   * Handle /pot command
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
        case 'open':
          await this.openPot(ctx, args.slice(1));
          break;
        case 'deposit':
          await this.depositToPot(ctx, args.slice(1));
          break;
        case 'break':
          await this.breakPot(ctx, args.slice(1));
          break;
        case 'close':
          await this.closePot(ctx, args.slice(1));
          break;
        case 'status':
          await this.getPotStatus(ctx, args.slice(1));
          break;
        case 'list':
          await this.listPots(ctx);
          break;
        default:
          await this.showUsage(ctx);
      }

    } catch (error) {
      logger.error('Pot command error', { error, userId: ctx.from?.id });
      await ctx.reply('❌ An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Open a new pot
   */
  private async openPot(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /pot open <goal_amount> [label]\n\n' +
        '**Examples:**\n' +
        '/pot open 100\n' +
        '/pot open 500 Vacation fund\n' +
        '/pot open 1000 Emergency savings'
      );
      return;
    }

    const goalAmount = parseFloat(args[0]);
    if (isNaN(goalAmount) || goalAmount <= 0) {
      await ctx.reply('❌ Invalid goal amount. Please provide a positive number.');
      return;
    }

    const label = args.slice(1).join(' ') || 'Savings Goal';

    // Convert to usei
    const goalUsei = Math.floor(goalAmount * 1000000).toString();

    try {
      const result = await this.sdk.openPot(goalUsei, 'usei', label);

      if (result.success) {
        await ctx.reply(
          `🏺 **Savings Pot Opened Successfully!**\n\n` +
          `**Goal:** ${goalAmount} SEI (${goalUsei} usei)\n` +
          `**Label:** ${label}\n` +
          `**Transaction Hash:** \`${result.txHash}\`\n\n` +
          `Start saving towards your goal! Use /pot deposit to add funds.`,
          { parse_mode: 'Markdown' }
        );

        logger.logTransaction(ctx.from!.id, 'pot_open', result.txHash!, true);
        logger.logUserActivity(ctx.from!.id, 'pot_opened', {
          goal: goalUsei,
          label,
          txHash: result.txHash
        });
      } else {
        await ctx.reply(
          `❌ **Pot Creation Failed**\n\n` +
          `**Error:** ${result.error}\n\n` +
          `Please try again or contact support.`
        );

        logger.logTransaction(ctx.from!.id, 'pot_open', 'failed', false);
      }
    } catch (error) {
      logger.error('Open pot error', { error, userId: ctx.from!.id });
      await ctx.reply('❌ Failed to open pot. Please try again.');
    }
  }

  /**
   * Deposit to a pot
   */
  private async depositToPot(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 2) {
      await ctx.reply(
        '❌ **Usage:** /pot deposit <pot_id> <amount>\n\n' +
        '**Examples:**\n' +
        '/pot deposit 123 10.5\n' +
        '/pot deposit 456 25'
      );
      return;
    }

    const potId = parseInt(args[0]);
    if (isNaN(potId)) {
      await ctx.reply('❌ Invalid pot ID. Please provide a valid number.');
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
      // This would require implementing depositToPot in the SDK
      // For now, we'll show a message
      await ctx.reply(
        `💰 **Pot Deposit**\n\n` +
        `Pot deposit functionality is coming soon!\n\n` +
        `**Pot ID:** #${potId}\n` +
        `**Amount:** ${amount} SEI (${amountUsei} usei)\n` +
        `**Status:** Under development\n\n` +
        `This will allow you to:\n` +
        `• Add funds to your savings pot\n` +
        `• Track progress towards your goal\n` +
        `• Earn rewards for consistent saving`
      );

      logger.logUserActivity(ctx.from!.id, 'pot_deposit_requested', {
        potId,
        amount: amountUsei
      });
    } catch (error) {
      logger.error('Deposit to pot error', { error, userId: ctx.from!.id, potId });
      await ctx.reply('❌ Failed to deposit to pot. Please try again.');
    }
  }

  /**
   * Break a pot (emergency withdrawal)
   */
  private async breakPot(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /pot break <pot_id>\n\n' +
        '**Examples:**\n' +
        '/pot break 123\n' +
        '/pot break 456\n\n' +
        '**Warning:** Breaking a pot will withdraw all funds and close it permanently!'
      );
      return;
    }

    const potId = parseInt(args[0]);
    if (isNaN(potId)) {
      await ctx.reply('❌ Invalid pot ID. Please provide a valid number.');
      return;
    }

    try {
      // This would require implementing breakPot in the SDK
      await ctx.reply(
        `🔨 **Break Pot**\n\n` +
        `Pot breaking functionality is coming soon!\n\n` +
        `**Pot ID:** #${potId}\n` +
        `**Status:** Under development\n\n` +
        `This will allow you to:\n` +
        `• Emergency withdrawal of all funds\n` +
        `• Close the pot permanently\n` +
        `• Bypass goal requirements\n\n` +
        `⚠️ **Warning:** This action cannot be undone!`
      );

      logger.logUserActivity(ctx.from!.id, 'pot_break_requested', { potId });
    } catch (error) {
      logger.error('Break pot error', { error, userId: ctx.from!.id, potId });
      await ctx.reply('❌ Failed to break pot. Please try again.');
    }
  }

  /**
   * Close a pot (when goal is reached)
   */
  private async closePot(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /pot close <pot_id>\n\n' +
        '**Examples:**\n' +
        '/pot close 123\n' +
        '/pot close 456\n\n' +
        '**Note:** You can only close a pot when the savings goal is reached!'
      );
      return;
    }

    const potId = parseInt(args[0]);
    if (isNaN(potId)) {
      await ctx.reply('❌ Invalid pot ID. Please provide a valid number.');
      return;
    }

    try {
      // This would require implementing closePot in the SDK
      await ctx.reply(
        `🎯 **Close Pot**\n\n` +
        `Pot closing functionality is coming soon!\n\n` +
        `**Pot ID:** #${potId}\n` +
        `**Status:** Under development\n\n` +
        `This will allow you to:\n` +
        `• Close pot when goal is reached\n` +
        `• Withdraw all funds with bonus\n` +
        `• Celebrate your achievement!\n\n` +
        `🎉 **Congratulations on reaching your goal!**`
      );

      logger.logUserActivity(ctx.from!.id, 'pot_close_requested', { potId });
    } catch (error) {
      logger.error('Close pot error', { error, userId: ctx.from!.id, potId });
      await ctx.reply('❌ Failed to close pot. Please try again.');
    }
  }

  /**
   * Get pot status
   */
  private async getPotStatus(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /pot status <pot_id>\n\n' +
        '**Examples:**\n' +
        '/pot status 123\n' +
        '/pot status 456'
      );
      return;
    }

    const potId = parseInt(args[0]);
    if (isNaN(potId)) {
      await ctx.reply('❌ Invalid pot ID. Please provide a valid number.');
      return;
    }

    try {
      // This would require implementing getPot in the SDK
      await ctx.reply(
        `📊 **Pot Status**\n\n` +
        `Pot status functionality is coming soon!\n\n` +
        `**Pot ID:** #${potId}\n` +
        `**Status:** Under development\n\n` +
        `Soon you'll be able to see:\n` +
        `• Current balance\n` +
        `• Progress towards goal\n` +
        `• Deposit history\n` +
        `• Estimated completion date`
      );

      logger.logUserActivity(ctx.from!.id, 'pot_status_requested', { potId });
    } catch (error) {
      logger.error('Get pot status error', { error, userId: ctx.from!.id, potId });
      await ctx.reply('❌ Failed to get pot status. Please try again.');
    }
  }

  /**
   * List user's pots
   */
  private async listPots(ctx: Context): Promise<void> {
    try {
      // This would require implementing listPots in the SDK
      await ctx.reply(
        `📋 **Your Pots**\n\n` +
        `Pot listing functionality is coming soon!\n\n` +
        `You'll be able to see:\n` +
        `• All your active pots\n` +
        `• Progress for each goal\n` +
        `• Total savings across pots\n` +
        `• Completion estimates`
      );

      logger.logUserActivity(ctx.from!.id, 'pot_list_requested');
    } catch (error) {
      logger.error('List pots error', { error, userId: ctx.from!.id });
      await ctx.reply('❌ Failed to list pots. Please try again.');
    }
  }

  /**
   * Show pot usage
   */
  private async showUsage(ctx: Context): Promise<void> {
    const usage = 
      `🏺 **Pot Command Usage**\n\n` +
      `**Open Pot:**\n` +
      `/pot open <goal_amount> [label]\n\n` +
      `**Deposit:**\n` +
      `/pot deposit <pot_id> <amount>\n\n` +
      `**Break Pot (Emergency):**\n` +
      `/pot break <pot_id>\n\n` +
      `**Close Pot (Goal Reached):**\n` +
      `/pot close <pot_id>\n\n` +
      `**Status:**\n` +
      `/pot status <pot_id>\n\n` +
      `**List Pots:**\n` +
      `/pot list\n\n` +
      `**Examples:**\n` +
      `/pot open 500 Vacation fund\n` +
      `/pot deposit 123 25\n` +
      `/pot status 123`;

    await ctx.reply(usage, { parse_mode: 'Markdown' });
  }
}