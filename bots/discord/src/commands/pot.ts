/**
 * Pot command for Discord Bot
 */

import { ChatInputCommandInteraction } from 'discord.js';
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
        case 'open':
          await this.openPot(interaction);
          break;
        case 'deposit':
          await this.depositToPot(interaction);
          break;
        case 'status':
          await this.getPotStatus(interaction);
          break;
        default:
          await interaction.reply({
            content: '❌ Unknown pot subcommand',
            ephemeral: true
          });
      }

    } catch (error) {
      logger.error('Pot command error', { error, userId: interaction.user.id });
      
      const errorMessage = '❌ An unexpected error occurred. Please try again.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }

  /**
   * Open a new pot
   */
  private async openPot(interaction: ChatInputCommandInteraction): Promise<void> {
    const goal = interaction.options.getNumber('goal', true);
    const label = interaction.options.getString('label') || 'Savings Goal';

    if (goal <= 0) {
      await interaction.reply({
        content: '❌ Invalid goal amount. Please provide a positive number.',
        ephemeral: true
      });
      return;
    }

    // Convert to usei
    const goalUsei = Math.floor(goal * 1000000).toString();

    // Defer reply for long operation
    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await this.sdk.openPot(goalUsei, 'usei', label);

      if (result.success) {
        await interaction.editReply({
          content: `🏺 **Savings Pot Opened Successfully!**\n\n` +
                   `**Goal:** ${goal} SEI (${goalUsei} usei)\n` +
                   `**Label:** ${label}\n` +
                   `**Transaction Hash:** \`${result.txHash}\`\n\n` +
                   `Start saving towards your goal! Use \`/pot deposit\` to add funds.`
        });

        logger.logTransaction(parseInt(interaction.user.id), 'pot_open', result.txHash!, true);
        logger.logUserActivity(parseInt(interaction.user.id), 'pot_opened', {
          goal: goalUsei,
          label,
          txHash: result.txHash
        });
      } else {
        await interaction.editReply({
          content: `❌ **Pot Creation Failed**\n\n` +
                   `**Error:** ${result.error}\n\n` +
                   `Please try again or contact support.`
        });

        logger.logTransaction(interaction.user.id, 'pot_open', 'failed', false);
      }
    } catch (error) {
      logger.error('Open pot error', { error, userId: interaction.user.id });
      await interaction.editReply({
        content: '❌ Failed to open pot. Please try again.'
      });
    }
  }

  /**
   * Deposit to a pot
   */
  private async depositToPot(interaction: ChatInputCommandInteraction): Promise<void> {
    const potId = interaction.options.getInteger('pot_id', true);
    const amount = interaction.options.getNumber('amount', true);

    if (potId <= 0) {
      await interaction.reply({
        content: '❌ Invalid pot ID. Please provide a valid positive number.',
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
      // This would require implementing depositToPot in the SDK
      // For now, we'll show a message
      await interaction.editReply({
        content: `💰 **Pot Deposit**\n\n` +
                 `Pot deposit functionality is coming soon!\n\n` +
                 `**Pot ID:** #${potId}\n` +
                 `**Amount:** ${amount} SEI (${amountUsei} usei)\n` +
                 `**Status:** Under development\n\n` +
                 `This will allow you to:\n` +
                 `• Add funds to your savings pot\n` +
                 `• Track progress towards your goal\n` +
                 `• Earn rewards for consistent saving`
      });

      logger.logUserActivity(interaction.user.id, 'pot_deposit_requested', {
        potId,
        amount: amountUsei
      });
    } catch (error) {
      logger.error('Deposit to pot error', { error, userId: interaction.user.id, potId });
      await interaction.editReply({
        content: '❌ Failed to deposit to pot. Please try again.'
      });
    }
  }

  /**
   * Get pot status
   */
  private async getPotStatus(interaction: ChatInputCommandInteraction): Promise<void> {
    const potId = interaction.options.getInteger('pot_id', true);

    if (potId <= 0) {
      await interaction.reply({
        content: '❌ Invalid pot ID. Please provide a valid positive number.',
        ephemeral: true
      });
      return;
    }

    // Defer reply for long operation
    await interaction.deferReply({ ephemeral: true });

    try {
      // This would require implementing getPot in the SDK
      // For now, we'll show a message
      await interaction.editReply({
        content: `📊 **Pot Status**\n\n` +
                 `Pot status functionality is coming soon!\n\n` +
                 `**Pot ID:** #${potId}\n` +
                 `**Status:** Under development\n\n` +
                 `Soon you'll be able to see:\n` +
                 `• Current balance\n` +
                 `• Progress towards goal\n` +
                 `• Deposit history\n` +
                 `• Estimated completion date`
      });

      logger.logUserActivity(interaction.user.id, 'pot_status_requested', { potId });
    } catch (error) {
      logger.error('Get pot status error', { error, userId: interaction.user.id, potId });
      await interaction.editReply({
        content: '❌ Failed to get pot status. Please try again.'
      });
    }
  }
}