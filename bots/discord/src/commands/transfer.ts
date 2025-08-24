/**
 * Transfer command for Discord Bot
 */

import { ChatInputCommandInteraction } from 'discord.js';
import { SeiMoneyBotSDK } from '../lib/sdk';
import { SessionManager } from '../lib/session';
import { logger } from '../lib/logger';

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

      const recipient = interaction.options.getString('recipient', true);
      const amount = interaction.options.getNumber('amount', true);
      const remark = interaction.options.getString('remark') || undefined;

      // Validate recipient address
      if (!this.isValidSeiAddress(recipient)) {
        await interaction.reply({
          content: '❌ Invalid Sei address format',
          ephemeral: true
        });
        return;
      }

      // Validate amount
      if (amount <= 0) {
        await interaction.reply({
          content: '❌ Invalid amount. Please provide a positive number',
          ephemeral: true
        });
        return;
      }

      // Convert to usei (1 SEI = 1,000,000 usei)
      const amountUsei = Math.floor(amount * 1000000).toString();

      // Check user balance
      try {
        const balance = await this.sdk.getBalance(session.seiAddress!);
        if (parseInt(balance) < parseInt(amountUsei)) {
          await interaction.reply({
            content: '❌ Insufficient balance',
            ephemeral: true
          });
          return;
        }
      } catch (error) {
        logger.error('Failed to check balance', { error, userId });
        await interaction.reply({
          content: '⚠️ Unable to check balance. Please try again.',
          ephemeral: true
        });
        return;
      }

      // Defer reply for long operation
      await interaction.deferReply({ ephemeral: true });

      // Execute transfer
      const result = await this.sdk.createTransfer(
        recipient,
        amountUsei,
        'usei',
        remark
      );

      if (result.success) {
        await interaction.editReply({
          content: `✅ **Transfer Created Successfully!**\n\n` +
                   `**Transaction Hash:** \`${result.txHash}\`\n` +
                   `**Amount:** ${amount} SEI\n` +
                   `**Recipient:** \`${recipient}\`\n` +
                   `**Remark:** ${remark || 'No remark'}\n\n` +
                   `The recipient can claim this transfer using the transaction hash.`
        });

        // Log successful transfer
        logger.logTransaction(userId, 'transfer', result.txHash!, true);
        logger.logUserActivity(userId, 'transfer_created', {
          recipient,
          amount: amountUsei,
          remark,
          txHash: result.txHash
        });
      } else {
        await interaction.editReply({
          content: `❌ **Transfer Failed**\n\n` +
                   `**Error:** ${result.error}\n\n` +
                   `Please try again or contact support.`
        });

        // Log failed transfer
        logger.logTransaction(userId, 'transfer', 'failed', false);
        logger.error('Transfer failed', {
          userId,
          error: result.error,
          recipient,
          amount: amountUsei
        });
      }

    } catch (error) {
      logger.error('Transfer command error', { error, userId: interaction.user.id });
      
      const errorMessage = '❌ An unexpected error occurred. Please try again.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }

  /**
   * Validate Sei address format
   */
  private isValidSeiAddress(address: string): boolean {
    return /^sei1[a-z0-9]{38}$/.test(address);
  }
}