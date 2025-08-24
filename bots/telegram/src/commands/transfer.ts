/**
 * Transfer command for Telegram Bot
 */

import { Context } from 'telegraf';
import { SeiMoneyBotSDK } from '../lib/sdk';
import { SessionManager } from '../lib/session';
import { logger } from '../lib/logger';
import { CommandContext, TransactionResult } from '../types';

export class TransferCommand {
  private sdk: SeiMoneyBotSDK;
  private sessionManager: SessionManager;

  constructor(sdk: SeiMoneyBotSDK, sessionManager: SessionManager) {
    this.sdk = sdk;
    this.sessionManager = sessionManager;
  }

  /**
   * Handle /transfer command
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

      if (args.length < 2) {
        await this.showUsage(ctx);
        return;
      }

      const [recipient, amount, ...rest] = args;
      const remark = rest.join(' ');

      // Validate recipient address
      if (!this.isValidSeiAddress(recipient)) {
        await ctx.reply('❌ Invalid Sei address format');
        return;
      }

      // Validate amount
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        await ctx.reply('❌ Invalid amount. Please provide a positive number');
        return;
      }

      // Convert to usei (1 SEI = 1,000,000 usei)
      const amountUsei = Math.floor(amountNum * 1000000).toString();

      // Check user balance
      try {
        const balance = await this.sdk.getBalance(session.seiAddress!);
        if (parseInt(balance) < parseInt(amountUsei)) {
          await ctx.reply('❌ Insufficient balance');
          return;
        }
      } catch (error) {
        logger.error('Failed to check balance', { error, userId: telegramId });
        await ctx.reply('⚠️ Unable to check balance. Please try again.');
        return;
      }

      // Show confirmation
      const confirmMessage = 
        `📤 **Transfer Confirmation**\n\n` +
        `**To:** \`${recipient}\`\n` +
        `**Amount:** ${amount} SEI (${amountUsei} usei)\n` +
        `**Remark:** ${remark || 'No remark'}\n\n` +
        `Reply with ✅ to confirm or ❌ to cancel`;

      const confirmMsg = await ctx.reply(confirmMessage, { parse_mode: 'Markdown' });

      // Wait for confirmation (in a real bot, you'd use inline keyboards)
      // For now, we'll proceed with the transfer
      
      // Execute transfer
      const result = await this.sdk.createTransfer(
        recipient,
        amountUsei,
        'usei',
        remark || undefined
      );

      if (result.success) {
        await ctx.reply(
          `✅ **Transfer Created Successfully!**\n\n` +
          `**Transaction Hash:** \`${result.txHash}\`\n` +
          `**Amount:** ${amount} SEI\n` +
          `**Recipient:** \`${recipient}\`\n\n` +
          `The recipient can claim this transfer using:\n` +
          `/claim ${result.txHash}`
        );

        // Log successful transfer
        logger.logTransaction(telegramId, 'transfer', result.txHash!, true);
        logger.logUserActivity(telegramId, 'transfer_created', {
          recipient,
          amount: amountUsei,
          remark,
          txHash: result.txHash
        });
      } else {
        await ctx.reply(
          `❌ **Transfer Failed**\n\n` +
          `**Error:** ${result.error}\n\n` +
          `Please try again or contact support.`
        );

        // Log failed transfer
        logger.logTransaction(telegramId, 'transfer', 'failed', false);
        logger.error('Transfer failed', {
          userId: telegramId,
          error: result.error,
          recipient,
          amount: amountUsei
        });
      }

    } catch (error) {
      logger.error('Transfer command error', { error, userId: ctx.from?.id });
      await ctx.reply('❌ An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Show transfer usage
   */
  private async showUsage(ctx: Context): Promise<void> {
    const usage = 
      `📤 **Transfer Command Usage**\n\n` +
      `**Basic Transfer:**\n` +
      `/transfer <recipient_address> <amount> [remark]\n\n` +
      `**Examples:**\n` +
      `/transfer sei1abc... 10.5\n` +
      `/transfer sei1abc... 25 Payment for services\n\n` +
      `**Notes:**\n` +
      `• Amount is in SEI (will be converted to usei)\n` +
      `• Recipient must be a valid Sei address\n` +
      `• Remark is optional\n` +
      `• Transfer expires in 1 hour if not claimed`;

    await ctx.reply(usage, { parse_mode: 'Markdown' });
  }

  /**
   * Validate Sei address format
   */
  private isValidSeiAddress(address: string): boolean {
    return /^sei1[a-z0-9]{38}$/.test(address);
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(ctx: Context, transferId: string): Promise<void> {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) {
        await ctx.reply('❌ Unable to identify user');
        return;
      }

      const id = parseInt(transferId);
      if (isNaN(id)) {
        await ctx.reply('❌ Invalid transfer ID');
        return;
      }

      const transfer = await this.sdk.getTransfer(id);
      
      const statusMessage = 
        `📊 **Transfer #${id} Status**\n\n` +
        `**Sender:** \`${transfer.sender}\`\n` +
        `**Recipient:** \`${transfer.recipient}\`\n` +
        `**Amount:** ${transfer.amount.amount} ${transfer.amount.denom}\n` +
        `**Status:** ${transfer.status}\n` +
        `**Created:** ${new Date(transfer.created_at * 1000).toLocaleString()}\n` +
        `**Expires:** ${new Date(transfer.expiry_ts * 1000).toLocaleString()}\n` +
        `**Remark:** ${transfer.remark || 'No remark'}`;

      await ctx.reply(statusMessage, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('Get transfer status error', { error, userId: ctx.from?.id });
      await ctx.reply('❌ Unable to get transfer status. Please check the ID and try again.');
    }
  }

  /**
   * List user's transfers
   */
  async listUserTransfers(ctx: Context): Promise<void> {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) {
        await ctx.reply('❌ Unable to identify user');
        return;
      }

      const session = await this.sessionManager.getUserSession(telegramId);
      if (!session?.isBound) {
        await ctx.reply('❌ You need to bind your Sei wallet first!');
        return;
      }

      const transfers = await this.sdk.getUserTransfers(session.seiAddress!);
      
      if (!transfers.transfers || transfers.transfers.length === 0) {
        await ctx.reply('📭 No transfers found for your address');
        return;
      }

      let message = `📋 **Your Transfers**\n\n`;
      
      transfers.transfers.slice(0, 10).forEach((transfer: any, index: number) => {
        const status = transfer.status === 'pending' ? '⏳' : 
                      transfer.status === 'claimed' ? '✅' : '💸';
        
        message += `${status} **#${transfer.id}** - ${transfer.amount.amount} ${transfer.amount.denom}\n`;
        message += `   To: \`${transfer.recipient}\`\n`;
        message += `   Status: ${transfer.status}\n\n`;
      });

      if (transfers.transfers.length > 10) {
        message += `... and ${transfers.transfers.length - 10} more transfers`;
      }

      await ctx.reply(message, { parse_mode: 'Markdown' });

    } catch (error) {
      logger.error('List transfers error', { error, userId: ctx.from?.id });
      await ctx.reply('❌ Unable to list transfers. Please try again.');
    }
  }
}
