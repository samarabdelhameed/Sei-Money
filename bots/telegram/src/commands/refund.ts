/**
 * Refund command for Telegram Bot
 */

import { Context } from 'telegraf';
import { SeiMoneyBotSDK } from '../lib/sdk';
import { SessionManager } from '../lib/session';
import { logger } from '../lib/logger';

export class RefundCommand {
  private sdk: SeiMoneyBotSDK;
  private sessionManager: SessionManager;

  constructor(sdk: SeiMoneyBotSDK, sessionManager: SessionManager) {
    this.sdk = sdk;
    this.sessionManager = sessionManager;
  }

  /**
   * Handle /refund command
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

      if (args.length < 1) {
        await this.showUsage(ctx);
        return;
      }

      const transferId = parseInt(args[0]);
      if (isNaN(transferId) || transferId <= 0) {
        await ctx.reply('❌ Invalid transfer ID. Please provide a valid positive number.');
        return;
      }

      try {
        // Check if transfer exists and is refundable
        const transfer = await this.sdk.getTransfer(transferId);
        
        if (!transfer) {
          await ctx.reply(`❌ Transfer #${transferId} not found.`);
          return;
        }

        if (transfer.status !== 'pending') {
          await ctx.reply(`❌ Transfer #${transferId} is not refundable. Status: ${transfer.status}`);
          return;
        }

        if (transfer.sender !== session.seiAddress) {
          await ctx.reply(`❌ You are not the sender of transfer #${transferId}.`);
          return;
        }

        // Check if transfer has expired (required for refund)
        const now = Math.floor(Date.now() / 1000);
        if (transfer.expiry_ts && now <= transfer.expiry_ts) {
          const expiryDate = new Date(transfer.expiry_ts * 1000);
          await ctx.reply(
            `❌ Transfer #${transferId} has not expired yet.\n\n` +
            `**Expires:** ${expiryDate.toLocaleString()}\n\n` +
            `You can only refund expired transfers.`,
            { parse_mode: 'Markdown' }
          );
          return;
        }

      } catch (error) {
        // If we can't get transfer details, still try to refund
        logger.warn('Could not verify transfer details, proceeding with refund', { 
          error, 
          transferId, 
          userId: telegramId 
        });
      }

      // Show processing message
      const processingMsg = await ctx.reply('⏳ Processing refund...');

      // Execute refund
      const result = await this.sdk.refundTransfer(transferId);

      if (result.success) {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          processingMsg.message_id,
          undefined,
          `💸 **Transfer Refunded Successfully!**\n\n` +
          `**Transfer ID:** #${transferId}\n` +
          `**Transaction Hash:** \`${result.txHash}\`\n\n` +
          `The funds have been returned to your wallet!`,
          { parse_mode: 'Markdown' }
        );

        // Log successful refund
        logger.logTransaction(telegramId, 'refund', result.txHash!, true);
        logger.logUserActivity(telegramId, 'transfer_refunded', {
          transferId,
          txHash: result.txHash
        });
      } else {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          processingMsg.message_id,
          undefined,
          `❌ **Refund Failed**\n\n` +
          `**Error:** ${result.error}\n\n` +
          `**Possible reasons:**\n` +
          `• Transfer doesn't exist\n` +
          `• Transfer already claimed or refunded\n` +
          `• Transfer not expired yet\n` +
          `• You're not the sender\n\n` +
          `Please verify the transfer ID and try again.`,
          { parse_mode: 'Markdown' }
        );

        // Log failed refund
        logger.logTransaction(telegramId, 'refund', 'failed', false);
        logger.error('Refund failed', {
          userId: telegramId,
          error: result.error,
          transferId
        });
      }

    } catch (error) {
      logger.error('Refund command error', { error, userId: ctx.from?.id });
      await ctx.reply('❌ An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Show refund usage
   */
  private async showUsage(ctx: Context): Promise<void> {
    const usage = 
      `💸 **Refund Command Usage**\n\n` +
      `**Basic Refund:**\n` +
      `/refund <transfer_id>\n\n` +
      `**Examples:**\n` +
      `/refund 123\n` +
      `/refund 456\n\n` +
      `**Notes:**\n` +
      `• You must be the sender of the transfer\n` +
      `• Transfer must be in 'pending' status\n` +
      `• Transfer must be expired\n` +
      `• You need to bind your wallet first\n\n` +
      `**When can you refund:**\n` +
      `• Only after the transfer expires\n` +
      `• If the recipient hasn't claimed it\n` +
      `• You created the original transfer\n\n` +
      `**How to find transfer ID:**\n` +
      `• Check your transfer creation messages\n` +
      `• Use /status to see your transfers`;

    await ctx.reply(usage, { parse_mode: 'Markdown' });
  }
}