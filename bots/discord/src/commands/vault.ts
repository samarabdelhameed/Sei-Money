/**
 * Vault command for Discord Bot
 */

import { ChatInputCommandInteraction } from 'discord.js';
import { SeiMoneyBotSDK } from '../lib/sdk';
import { SessionManager } from '../lib/session';
import { logger } from '../lib/logger';

export class VaultCommand {
  private sdk: SeiMoneyBotSDK;
  private sessionManager: SessionManager;

  constructor(sdk: SeiMoneyBotSDK, sessionManager: SessionManager) {
    this.sdk = sdk;
    this.sessionManager = sessionManager;
  }

  /**
   * Handle /vault command
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

      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'create':
          await this.createVault(interaction);
          break;
        case 'deposit':
          await this.depositToVault(interaction);
          break;
        case 'status':
          await this.getVaultStatus(interaction);
          break;
        default:
          await interaction.reply({
            content: '❌ Unknown vault subcommand',
            ephemeral: true
          });
      }

    } catch (error) {
      logger.error('Vault command error', { error, userId: interaction.user.id });
      
      const errorMessage = '❌ An unexpected error occurred. Please try again.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }

  /**
   * Create a new vault
   */
  private async createVault(interaction: ChatInputCommandInteraction): Promise<void> {
    const label = interaction.options.getString('label', true);
    const strategy = interaction.options.getString('strategy') || 'staking';

    // Defer reply for long operation
    await interaction.deferReply({ ephemeral: true });

    try {
      const result = await this.sdk.createVault(label, 'usei', strategy);

      if (result.success) {
        await interaction.editReply({
          content: `🏦 **Yield Vault Created Successfully!**\n\n` +
                   `**Label:** ${label}\n` +
                   `**Strategy:** ${strategy}\n` +
                   `**Denomination:** usei\n` +
                   `**Transaction Hash:** \`${result.txHash}\`\n\n` +
                   `Your vault is ready for deposits! Use \`/vault deposit\` to start earning yields.`
        });

        logger.logTransaction(interaction.user.id, 'vault_create', result.txHash!, true);
        logger.logUserActivity(interaction.user.id, 'vault_created', {
          label,
          strategy,
          txHash: result.txHash
        });
      } else {
        await interaction.editReply({
          content: `❌ **Vault Creation Failed**\n\n` +
                   `**Error:** ${result.error}\n\n` +
                   `Please try again or contact support.`
        });

        logger.logTransaction(interaction.user.id, 'vault_create', 'failed', false);
      }
    } catch (error) {
      logger.error('Create vault error', { error, userId: interaction.user.id });
      await interaction.editReply({
        content: '❌ Failed to create vault. Please try again.'
      });
    }
  }

  /**
   * Deposit to a vault
   */
  private async depositToVault(interaction: ChatInputCommandInteraction): Promise<void> {
    const vaultId = interaction.options.getInteger('vault_id', true);
    const amount = interaction.options.getNumber('amount', true);

    if (vaultId <= 0) {
      await interaction.reply({
        content: '❌ Invalid vault ID. Please provide a valid positive number.',
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
      // This would require implementing depositToVault in the SDK
      // For now, we'll show a message
      await interaction.editReply({
        content: `💰 **Vault Deposit**\n\n` +
                 `Vault deposit functionality is coming soon!\n\n` +
                 `**Vault ID:** #${vaultId}\n` +
                 `**Amount:** ${amount} SEI (${amountUsei} usei)\n` +
                 `**Status:** Under development\n\n` +
                 `This will allow you to:\n` +
                 `• Deposit funds to earn yields\n` +
                 `• Receive vault shares (LP tokens)\n` +
                 `• Participate in automated strategies\n` +
                 `• Compound your earnings`
      });

      logger.logUserActivity(interaction.user.id, 'vault_deposit_requested', {
        vaultId,
        amount: amountUsei
      });
    } catch (error) {
      logger.error('Deposit to vault error', { error, userId: interaction.user.id, vaultId });
      await interaction.editReply({
        content: '❌ Failed to deposit to vault. Please try again.'
      });
    }
  }

  /**
   * Get vault status
   */
  private async getVaultStatus(interaction: ChatInputCommandInteraction): Promise<void> {
    const vaultId = interaction.options.getInteger('vault_id', true);

    if (vaultId <= 0) {
      await interaction.reply({
        content: '❌ Invalid vault ID. Please provide a valid positive number.',
        ephemeral: true
      });
      return;
    }

    // Defer reply for long operation
    await interaction.deferReply({ ephemeral: true });

    try {
      // This would require implementing getVault in the SDK
      // For now, we'll show a message
      await interaction.editReply({
        content: `📊 **Vault Status**\n\n` +
                 `Vault status functionality is coming soon!\n\n` +
                 `**Vault ID:** #${vaultId}\n` +
                 `**Status:** Under development\n\n` +
                 `Soon you'll be able to see:\n` +
                 `• Total value locked (TVL)\n` +
                 `• Current APY/APR\n` +
                 `• Your share balance\n` +
                 `• Pending rewards\n` +
                 `• Strategy performance\n` +
                 `• Harvest opportunities`
      });

      logger.logUserActivity(interaction.user.id, 'vault_status_requested', { vaultId });
    } catch (error) {
      logger.error('Get vault status error', { error, userId: interaction.user.id, vaultId });
      await interaction.editReply({
        content: '❌ Failed to get vault status. Please try again.'
      });
    }
  }
}