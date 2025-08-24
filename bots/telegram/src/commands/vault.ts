/**
 * Vault command for Telegram Bot
 */

import { Context } from 'telegraf';
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
        case 'create':
          await this.createVault(ctx, args.slice(1));
          break;
        case 'deposit':
          await this.depositToVault(ctx, args.slice(1));
          break;
        case 'withdraw':
          await this.withdrawFromVault(ctx, args.slice(1));
          break;
        case 'harvest':
          await this.harvestVault(ctx, args.slice(1));
          break;
        case 'rebalance':
          await this.rebalanceVault(ctx, args.slice(1));
          break;
        case 'status':
          await this.getVaultStatus(ctx, args.slice(1));
          break;
        case 'list':
          await this.listVaults(ctx);
          break;
        default:
          await this.showUsage(ctx);
      }

    } catch (error) {
      logger.error('Vault command error', { error, userId: ctx.from?.id });
      await ctx.reply('❌ An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Create a new vault
   */
  private async createVault(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /vault create <label> [denom] [strategy] [fee_percent]\n\n' +
        '**Examples:**\n' +
        '/vault create MyVault\n' +
        '/vault create StakingVault usei staking 1.5\n' +
        '/vault create YieldFarm usei liquidity 2.0'
      );
      return;
    }

    const label = args[0];
    const denom = args[1] || 'usei';
    const strategy = args[2] || 'staking';
    const feePercent = args[3] ? parseFloat(args[3]) : 1.0;

    if (isNaN(feePercent) || feePercent < 0 || feePercent > 10) {
      await ctx.reply('❌ Invalid fee percentage. Please provide a value between 0 and 10.');
      return;
    }

    const feeBps = Math.floor(feePercent * 100); // Convert to basis points

    try {
      const result = await this.sdk.createVault(label, denom, strategy, feeBps);

      if (result.success) {
        await ctx.reply(
          `🏦 **Yield Vault Created Successfully!**\n\n` +
          `**Label:** ${label}\n` +
          `**Denomination:** ${denom}\n` +
          `**Strategy:** ${strategy}\n` +
          `**Fee:** ${feePercent}%\n` +
          `**Transaction Hash:** \`${result.txHash}\`\n\n` +
          `Your vault is ready for deposits! Use /vault deposit to start earning yields.`,
          { parse_mode: 'Markdown' }
        );

        logger.logTransaction(ctx.from!.id, 'vault_create', result.txHash!, true);
        logger.logUserActivity(ctx.from!.id, 'vault_created', {
          label,
          denom,
          strategy,
          feeBps,
          txHash: result.txHash
        });
      } else {
        await ctx.reply(
          `❌ **Vault Creation Failed**\n\n` +
          `**Error:** ${result.error}\n\n` +
          `Please try again or contact support.`
        );

        logger.logTransaction(ctx.from!.id, 'vault_create', 'failed', false);
      }
    } catch (error) {
      logger.error('Create vault error', { error, userId: ctx.from!.id });
      await ctx.reply('❌ Failed to create vault. Please try again.');
    }
  }

  /**
   * Deposit to a vault
   */
  private async depositToVault(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 2) {
      await ctx.reply(
        '❌ **Usage:** /vault deposit <vault_id> <amount>\n\n' +
        '**Examples:**\n' +
        '/vault deposit 123 10.5\n' +
        '/vault deposit 456 25'
      );
      return;
    }

    const vaultId = parseInt(args[0]);
    if (isNaN(vaultId)) {
      await ctx.reply('❌ Invalid vault ID. Please provide a valid number.');
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
      // This would require implementing depositToVault in the SDK
      await ctx.reply(
        `💰 **Vault Deposit**\n\n` +
        `Vault deposit functionality is coming soon!\n\n` +
        `**Vault ID:** #${vaultId}\n` +
        `**Amount:** ${amount} SEI (${amountUsei} usei)\n` +
        `**Status:** Under development\n\n` +
        `This will allow you to:\n` +
        `• Deposit funds to earn yields\n` +
        `• Receive vault shares (LP tokens)\n` +
        `• Participate in automated strategies\n` +
        `• Compound your earnings`
      );

      logger.logUserActivity(ctx.from!.id, 'vault_deposit_requested', {
        vaultId,
        amount: amountUsei
      });
    } catch (error) {
      logger.error('Deposit to vault error', { error, userId: ctx.from!.id, vaultId });
      await ctx.reply('❌ Failed to deposit to vault. Please try again.');
    }
  }

  /**
   * Withdraw from a vault
   */
  private async withdrawFromVault(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 2) {
      await ctx.reply(
        '❌ **Usage:** /vault withdraw <vault_id> <shares>\n\n' +
        '**Examples:**\n' +
        '/vault withdraw 123 50\n' +
        '/vault withdraw 456 100'
      );
      return;
    }

    const vaultId = parseInt(args[0]);
    if (isNaN(vaultId)) {
      await ctx.reply('❌ Invalid vault ID. Please provide a valid number.');
      return;
    }

    const shares = parseFloat(args[1]);
    if (isNaN(shares) || shares <= 0) {
      await ctx.reply('❌ Invalid shares amount. Please provide a positive number.');
      return;
    }

    try {
      // This would require implementing withdrawFromVault in the SDK
      await ctx.reply(
        `💸 **Vault Withdrawal**\n\n` +
        `Vault withdrawal functionality is coming soon!\n\n` +
        `**Vault ID:** #${vaultId}\n` +
        `**Shares:** ${shares}\n` +
        `**Status:** Under development\n\n` +
        `This will allow you to:\n` +
        `• Withdraw your vault shares\n` +
        `• Receive underlying assets + yields\n` +
        `• Partial or full withdrawals\n` +
        `• Instant or delayed withdrawals`
      );

      logger.logUserActivity(ctx.from!.id, 'vault_withdraw_requested', {
        vaultId,
        shares
      });
    } catch (error) {
      logger.error('Withdraw from vault error', { error, userId: ctx.from!.id, vaultId });
      await ctx.reply('❌ Failed to withdraw from vault. Please try again.');
    }
  }

  /**
   * Harvest vault yields
   */
  private async harvestVault(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /vault harvest <vault_id>\n\n' +
        '**Examples:**\n' +
        '/vault harvest 123\n' +
        '/vault harvest 456'
      );
      return;
    }

    const vaultId = parseInt(args[0]);
    if (isNaN(vaultId)) {
      await ctx.reply('❌ Invalid vault ID. Please provide a valid number.');
      return;
    }

    try {
      // This would require implementing harvestVault in the SDK
      await ctx.reply(
        `🌾 **Vault Harvest**\n\n` +
        `Vault harvesting functionality is coming soon!\n\n` +
        `**Vault ID:** #${vaultId}\n` +
        `**Status:** Under development\n\n` +
        `This will allow you to:\n` +
        `• Harvest accumulated yields\n` +
        `• Compound earnings automatically\n` +
        `• Claim reward tokens\n` +
        `• Optimize yield strategies`
      );

      logger.logUserActivity(ctx.from!.id, 'vault_harvest_requested', { vaultId });
    } catch (error) {
      logger.error('Harvest vault error', { error, userId: ctx.from!.id, vaultId });
      await ctx.reply('❌ Failed to harvest vault. Please try again.');
    }
  }

  /**
   * Rebalance vault
   */
  private async rebalanceVault(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /vault rebalance <vault_id>\n\n' +
        '**Examples:**\n' +
        '/vault rebalance 123\n' +
        '/vault rebalance 456'
      );
      return;
    }

    const vaultId = parseInt(args[0]);
    if (isNaN(vaultId)) {
      await ctx.reply('❌ Invalid vault ID. Please provide a valid number.');
      return;
    }

    try {
      // This would require implementing rebalanceVault in the SDK
      await ctx.reply(
        `⚖️ **Vault Rebalance**\n\n` +
        `Vault rebalancing functionality is coming soon!\n\n` +
        `**Vault ID:** #${vaultId}\n` +
        `**Status:** Under development\n\n` +
        `This will allow you to:\n` +
        `• Rebalance asset allocations\n` +
        `• Optimize yield strategies\n` +
        `• Adjust risk parameters\n` +
        `• Maintain target ratios`
      );

      logger.logUserActivity(ctx.from!.id, 'vault_rebalance_requested', { vaultId });
    } catch (error) {
      logger.error('Rebalance vault error', { error, userId: ctx.from!.id, vaultId });
      await ctx.reply('❌ Failed to rebalance vault. Please try again.');
    }
  }

  /**
   * Get vault status
   */
  private async getVaultStatus(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /vault status <vault_id>\n\n' +
        '**Examples:**\n' +
        '/vault status 123\n' +
        '/vault status 456'
      );
      return;
    }

    const vaultId = parseInt(args[0]);
    if (isNaN(vaultId)) {
      await ctx.reply('❌ Invalid vault ID. Please provide a valid number.');
      return;
    }

    try {
      // This would require implementing getVault in the SDK
      await ctx.reply(
        `📊 **Vault Status**\n\n` +
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
      );

      logger.logUserActivity(ctx.from!.id, 'vault_status_requested', { vaultId });
    } catch (error) {
      logger.error('Get vault status error', { error, userId: ctx.from!.id, vaultId });
      await ctx.reply('❌ Failed to get vault status. Please try again.');
    }
  }

  /**
   * List user's vaults
   */
  private async listVaults(ctx: Context): Promise<void> {
    try {
      // This would require implementing listVaults in the SDK
      await ctx.reply(
        `📋 **Your Vaults**\n\n` +
        `Vault listing functionality is coming soon!\n\n` +
        `You'll be able to see:\n` +
        `• All your active vaults\n` +
        `• Performance metrics\n` +
        `• Total deposited amounts\n` +
        `• Earned yields\n` +
        `• Available actions`
      );

      logger.logUserActivity(ctx.from!.id, 'vault_list_requested');
    } catch (error) {
      logger.error('List vaults error', { error, userId: ctx.from!.id });
      await ctx.reply('❌ Failed to list vaults. Please try again.');
    }
  }

  /**
   * Show vault usage
   */
  private async showUsage(ctx: Context): Promise<void> {
    const usage = 
      `🏦 **Vault Command Usage**\n\n` +
      `**Create Vault:**\n` +
      `/vault create <label> [denom] [strategy] [fee_percent]\n\n` +
      `**Deposit:**\n` +
      `/vault deposit <vault_id> <amount>\n\n` +
      `**Withdraw:**\n` +
      `/vault withdraw <vault_id> <shares>\n\n` +
      `**Harvest:**\n` +
      `/vault harvest <vault_id>\n\n` +
      `**Rebalance:**\n` +
      `/vault rebalance <vault_id>\n\n` +
      `**Status:**\n` +
      `/vault status <vault_id>\n\n` +
      `**List Vaults:**\n` +
      `/vault list\n\n` +
      `**Strategies:**\n` +
      `• staking - Stake tokens for rewards\n` +
      `• liquidity - Provide liquidity\n` +
      `• lending - Lend assets for interest\n\n` +
      `**Examples:**\n` +
      `/vault create MyVault usei staking 1.5\n` +
      `/vault deposit 123 25\n` +
      `/vault harvest 123`;

    await ctx.reply(usage, { parse_mode: 'Markdown' });
  }
}