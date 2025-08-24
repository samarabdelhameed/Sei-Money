/**
 * Refund command for Discord Bot
 */

import { ChatInputCommandInteraction } from 'discord.js';
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
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const userId = parseInt(interaction.user.id);

      // Get user session
      const session = await this.sessionManager.getUserSession(userId);
      if (!session?.isBound) {
        await interaction.reply({
          content: '❌ You need to bind your Sei wallet first!\n\nUse `/bind <your_sei_address>` to connect your wallet.',
          ephemeral: true
        });
        return;
      }

      const transferId = interaction.options.getInteger('transfer_id', true);

      // Validate transfer ID
      if (transferId <= 0) {
        await interaction.reply({
          content: '❌ Invalid transfer ID. Please provide a valid positive number.',
          ephemeral: true
        });
        return;
      }

      // Defer reply for long operation
      await interaction.deferReply({ ephemeral: true });

      try {
        // Check if transfer exists and is refundable
        const transfer = await this.sdk.getTransfer(transferId);
        
        if (!transfer) {
          await interaction.editReply({
            content: `❌ Transfer #${transferId} not found.`
          });
          return;
        }

        if (transfer.status !== 'pending') {
          await interaction.editReply({
            content: `❌ Transfer #${transferId} is not refundable. Status: ${transfer.status}`
          });
          return;
        }

        if (transfer.sender !== session.seiAddress) {
          await interaction.editReply({
            content: `❌ You are not the sender of transfer #${transferId}.`
          });
          return;
        }

        // Check if transfer has expired (required for refund)
        const now = Math.floor(Date.now() / 1000);
        if (transfer.expiry_ts && now <= transfer.expiry_ts) {
          const expiryDate = new Date(transfer.expiry_ts * 1000);
          await interaction.editReply({
            content: `❌ Transfer #${transferId} has not expired yet.\n\n` +
                     `**Expires:** ${expiryDate.toLocaleString()}\n\n` +
                     `You can only refund expired transfers.`
          });
          return;
        }

      } catch (error) {
        // If we can't get transfer details, still try to refund
        logger.warn('Could not verify transfer details, proceeding with refund', { 
          error, 
          transferId, 
          userId 
        });
      }

      // Execute refund
      const result = await this.sdk.refundTransfer(transferId);

      if (result.success) {
        await interaction.editReply({
          content: `💸 **Transfer Refunded Successfully!**\n\n` +
                   `**Transfer ID:** #${transferId}\n` +
                   `**Transaction Hash:** \`${result.txHash}\`\n\n` +
                   `The funds have been returned to your wallet!`
        });

        // Log successful refund
        logger.logTransaction(userId, 'refund', result.txHash!, true);
        logger.logUserActivity(userId, 'transfer_refunded', {
          transferId,
          txHash: result.txHash
        });
      } else {
        await interaction.editReply({
          content: `❌ **Refund Failed**\n\n` +
                   `**Error:** ${result.error}\n\n` +
                   `Possible reasons:\n` +
                   `• Transfer doesn't exist\n` +
                   `• Transfer already claimed or refunded\n` +
                   `• Transfer not expired yet\n` +
                   `• You're not the sender\n\n` +
                   `Please verify the transfer ID and try again.`
        });

        // Log failed refund
        logger.logTransaction(userId, 'refund', 'failed', false);
        logger.error('Refund failed', {
          userId,
          error: result.error,
          transferId
        });
      }

    } catch (error) {
              logger.error('Refund command error', { error, userId: parseInt(interaction.user.id) });
      
      const errorMessage = '❌ An unexpected error occurred. Please try again.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }
}