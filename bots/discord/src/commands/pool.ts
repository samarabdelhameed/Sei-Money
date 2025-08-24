/**
 * Pool command for Discord Bot
 */

import { ChatInputCommandInteraction } from 'discord.js';
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

      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'create':
          await this.createPool(interaction);
          break;
        case 'contribute':
          await this.contributeToPool(interaction);
          break;
        case 'status':
          await this.getPoolStatus(interaction);
          break;
        default:
          await interaction.reply({
            content: '❌ Unknown pool subcommand',
            ephemeral: true
          });
      }

    } catch (error) {
      logger.error('Pool command error', { error, userId: interaction.user.id });
      
      const errorMessage = '❌ An unexpected error occurred. Please try again.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }

  /**
   * Create a new pool
   */
  private async createPool(interaction: ChatInputCommandInteraction): Promise<void> {
    const targetAmount = interaction.options.getNumber('target', true);
    const memo = interaction.options.getString('memo') || 'Pool funding';
    const expiryHours = interaction.options.getInteger('expiry_hours') || 24;

    if (targetAmount <= 0) {
      await interaction.reply({
        content: '❌ Invalid target amount. Please provide a positive number.',
        ephemeral: true
      });
      return;
    }

    if (expiryHours <= 0) {
      await interaction.reply({
        content: '❌ Invalid expiry hours. Please provide a positive number.',
        ephemeral: true
      });
      return;
    }

    // Convert to usei
    const targetUsei = Math.floor(targetAmount * 1000000).toString();
    const expiryTs = Math.floor(Date.now() / 1000) + (expiryHours * 3600);

    // Defer reply for long operation
    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await this.sdk.createPool(targetUsei, 'usei', memo, expiryTs);

      if (result.success) {
        await interaction.editReply({
          content: `👥 **Pool Created Successfully!**\n\n` +
                   `**Target:** ${targetAmount} SEI (${targetUsei} usei)\n` +
                   `**Memo:** ${memo}\n` +
                   `**Expires:** <t:${expiryTs}:F>\n` +
                   `**Transaction Hash:** \`${result.txHash}\`\n\n` +
                   `Share this pool information with contributors!`
        });

        logger.logTransaction(parseInt(interaction.user.id), 'pool_create', result.txHash!, true);
        logger.logUserActivity(parseInt(interaction.user.id), 'pool_created', {
          targetAmount: targetUsei,
          memo,
          expiryTs,
          txHash: result.txHash
        });
      } else {
        await interaction.editReply({
          content: `❌ **Pool Creation Failed**\n\n` +
                   `**Error:** ${result.error}\n\n` +
                   `Please try again or contact support.`
        });

        logger.logTransaction(parseInt(interaction.user.id), 'pool_create', 'failed', false);
      }
    } catch (error) {
      logger.error('Create pool error', { error, userId: parseInt(interaction.user.id) });
      await interaction.editReply({
        content: '❌ Failed to create pool. Please try again.'
      });
    }
  }

  /**
   * Contribute to a pool
   */
  private async contributeToPool(interaction: ChatInputCommandInteraction): Promise<void> {
    const poolId = interaction.options.getInteger('pool_id', true);
    const amount = interaction.options.getNumber('amount', true);

    if (poolId <= 0) {
      await interaction.reply({
        content: '❌ Invalid pool ID. Please provide a valid positive number.',
        ephemeral: true
      });
      return;
    }

    if (amount <= 0) {
      await interaction.reply({
        content: '❌ Invalid amount. Please provide a positive number.',
        ephemeral: true
      });
      return;
    }

    // Convert to usei
    const amountUsei = Math.floor(amount * 1000000).toString();

    // Defer reply for long operation
    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await this.sdk.contributeToPool(poolId, amountUsei, 'usei');

      if (result.success) {
        await interaction.editReply({
          content: `💰 **Contribution Successful!**\n\n` +
                   `**Pool ID:** #${poolId}\n` +
                   `**Amount:** ${amount} SEI (${amountUsei} usei)\n` +
                   `**Transaction Hash:** \`${result.txHash}\`\n\n` +
                   `Thank you for your contribution!`
        });

        logger.logTransaction(parseInt(interaction.user.id), 'pool_contribute', result.txHash!, true);
        logger.logUserActivity(parseInt(interaction.user.id), 'pool_contributed', {
          poolId,
          amount: amountUsei,
          txHash: result.txHash
        });
      } else {
        await interaction.editReply({
          content: `❌ **Contribution Failed**\n\n` +
                   `**Error:** ${result.error}\n\n` +
                   `Please try again or contact support.`
        });

        logger.logTransaction(parseInt(interaction.user.id), 'pool_contribute', 'failed', false);
      }
    } catch (error) {
      logger.error('Contribute to pool error', { error, userId: parseInt(interaction.user.id), poolId });
      await interaction.editReply({
        content: '❌ Failed to contribute to pool. Please try again.'
      });
    }
  }

  /**
   * Get pool status
   */
  private async getPoolStatus(interaction: ChatInputCommandInteraction): Promise<void> {
    const poolId = interaction.options.getInteger('pool_id', true);

    if (poolId <= 0) {
      await interaction.reply({
        content: '❌ Invalid pool ID. Please provide a valid positive number.',
        ephemeral: true
      });
      return;
    }

    // Defer reply for long operation
    await interaction.deferReply({ ephemeral: true });

    try {
      // This would require implementing getPool in the SDK
      // For now, we'll show a message
      await interaction.editReply({
        content: `📊 **Pool Status**\n\n` +
                 `Pool status functionality is coming soon!\n\n` +
                 `**Pool ID:** #${poolId}\n` +
                 `**Status:** Under development\n\n` +
                 `Soon you'll be able to see:\n` +
                 `• Current contributions\n` +
                 `• Progress towards target\n` +
                 `• Contributors list\n` +
                 `• Expiry information`
      });

              logger.logUserActivity(parseInt(interaction.user.id), 'pool_status_requested', { poolId });
      } catch (error) {
        logger.error('Get pool status error', { error, userId: parseInt(interaction.user.id), poolId });
      await interaction.editReply({
        content: '❌ Failed to get pool status. Please try again.'
      });
    }
  }
}