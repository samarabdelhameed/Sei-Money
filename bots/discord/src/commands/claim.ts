/**
 * Claim command for Discord Bot
 */

import { ChatInputCommandInteraction } from 'discord.js';
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
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const userId = interaction.user.id;

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
        // Check if transfer exists and is claimable
        const transfer = await this.sdk.getTransfer(transferId);
        
        if (!transfer) {
          await interaction.editReply({
            content: `❌ Transfer #${transferId} not found.`
          });
          return;
        }

        if (transfer.status !== 'pending') {
          await interaction.editReply({
            content: `❌ Transfer #${transferId} is not claimable. Status: ${transfer.status}`
          });
          return;
        }

        if (transfer.recipient !== session.seiAddress) {
          await interaction.editReply({
            content: `❌ You are not the recipient of transfer #${transferId}.`
          });
          return;
        }

        // Check if transfer has expired
        const now = Math.floor(Date.now() / 1000);
        if (transfer.expiry_ts && now > transfer.expiry_ts) {
          await interaction.editReply({
            content: `❌ Transfer #${transferId} has expired and can no longer be claimed.`
          });
          return;
        }

      } catch (error) {
        // If we can't get transfer details, still try to claim
        logger.warn('Could not verify transfer details, proceeding with claim', { 
          error, 
          transferId, 
          userId 
        });
      }

      // Execute claim
      const result = await this.sdk.claimTransfer(transferId);

      if (result.success) {
        await interaction.editReply({
          content: `🎉 **Transfer Claimed Successfully!**\n\n` +
                   `**Transfer ID:** #${transferId}\n` +
                   `**Transaction Hash:** \`${result.txHash}\`\n\n` +
                   `The funds have been transferred to your wallet!`
        });

        // Log successful claim
        logger.logTransaction(userId, 'claim', result.txHash!, true);
        logger.logUserActivity(userId, 'transfer_claimed', {
          transferId,
          txHash: result.txHash
        });
      } else {
        await interaction.editReply({
          content: `❌ **Claim Failed**\n\n` +
                   `**Error:** ${result.error}\n\n` +
                   `Possible reasons:\n` +
                   `• Transfer doesn't exist\n` +
                   `• Transfer already claimed\n` +
                   `• Transfer expired\n` +
                   `• You're not the recipient\n\n` +
                   `Please verify the transfer ID and try again.`
        });

        // Log failed claim
        logger.logTransaction(userId, 'claim', 'failed', false);
        logger.error('Claim failed', {
          userId,
          error: result.error,
          transferId
        });
      }

    } catch (error) {
      logger.error('Claim command error', { error, userId: interaction.user.id });
      
      const errorMessage = '❌ An unexpected error occurred. Please try again.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }
}