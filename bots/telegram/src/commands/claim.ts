/**
 * Claim command for Telegram Bot
 */

import { Context } from 'telegraf';
import { SeiMoneyBotSDK } from '../lib/sdk';
import { SessionManager } from '../lib/session';
import { logger } from '../lib/logger';

export class ClaimCommand {
  private sdk: SeiMoneyBotSDK;
  private sessionManager: SessionManager;

  constructor(sdk: SeiMoneyBotSDK, sessionManager: SessionManager) {
    this.sdk = sdk;
    this.sessionManager = sessionManager;
  }

  /**
   * Handle /claim command
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
        // Check if transfer exists and is claimable
        const transfer = await this.sdk.getTransfer(transferId);
        
        if (!transfer) {
          await ctx.reply(`❌ Transfer #${transferId} not found.`);
          return;
        }

        if (transfer.status !== 'pending') {
          await ctx.reply(`❌ Transfer #${transferId} is not claimable. Status: ${transfer.status}`);
          return;
        }

        if (transfer.recipient !== session.seiAddress) {
          await ctx.reply(`❌ You are not the recipient of transfer #${transferId}.`);
          return;
        }

        // Check if transfer has expired
        const now = Math.floor(Date.now() / 1000);
        if (transfer.expiry_ts && now > transfer.expiry_ts) {
          await ctx.reply(`❌ Transfer #${transferId} has expired and can no longer be claimed.`);
          return;
        }

      } catch (error) {
        // If we can't get transfer details, still try to claim
        logger.warn('Could not verify transfer details, proceeding with claim', { 
          error, 
          transferId, 
          userId: telegramId 
        });
      }

      // Show processing message
      const processingMsg = await ctx.reply('⏳ Processing claim...');

      // Execute claim
      const result = await this.sdk.claimTransfer(transferId);

      if (result.success) {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          processingMsg.message_id,
          undefined,
          `🎉 **Transfer Claimed Successfully!**\n\n` +
          `**Transfer ID:** #${transferId}\n` +
          `**Transaction Hash:** \`${result.txHash}\`\n\n` +
          `The funds have been transferred to your wallet!`,
          { parse_mode: 'Markdown' }
        );

        // Log successful claim
        logger.logTransaction(telegramId, 'claim', result.txHash!, true);
        logger.logUserActivity(telegramId, 'transfer_claimed', {
          transferId,
          txHash: result.txHash
        });
      } else {
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          processingMsg.message_id,
          undefined,
          `❌ **Claim Failed**\n\n` +
          `**Error:** ${result.error}\n\n` +
          `**Possible reasons:**\n` +
          `• Transfer doesn't exist\n` +
          `• Transfer already claimed\n` +
          `• Transfer expired\n` +
          `• You're not the recipient\n\n` +
          `Please verify the transfer ID and try again.`,
          { parse_mode: 'Markdown' }
        );

        // Log failed claim
        logger.logTransaction(telegramId, 'claim', 'failed', false);
        logger.error('Claim failed', {
          userId: telegramId,
          error: result.error,
          transferId
        });
      }

    } catch (error) {
      logger.error('Claim command error', { error, userId: ctx.from?.id });
      await ctx.reply('❌ An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Show claim usage
   */
  private async showUsage(ctx: Context): Promise<void> {
    const usage = 
      `🎉 **Claim Command Usage**\n\n` +
      `**Basic Claim:**\n` +
      `/claim <transfer_id>\n\n` +
      `**Examples:**\n` +
      `/claim 123\n` +
      `/claim 456\n\n` +
      `**Notes:**\n` +
      `• You must be the recipient of the transfer\n` +
      `• Transfer must be in 'pending' status\n` +
      `• Transfer must not be expired\n` +
      `• You need to bind your wallet first\n\n` +
      `**How to find transfer ID:**\n` +
      `• Check the transfer creation message\n` +
      `• Ask the sender for the ID\n` +
      `• Use /status to see pending transfers`;

    await ctx.reply(usage, { parse_mode: 'Markdown' });
  }
}