/**
 * Escrow command for Telegram Bot
 */

import { Context } from 'telegraf';
import { SeiMoneyBotSDK } from '../lib/sdk';
import { SessionManager } from '../lib/session';
import { logger } from '../lib/logger';

export class EscrowCommand {
  private sdk: SeiMoneyBotSDK;
  private sessionManager: SessionManager;

  constructor(sdk: SeiMoneyBotSDK, sessionManager: SessionManager) {
    this.sdk = sdk;
    this.sessionManager = sessionManager;
  }

  /**
   * Handle /escrow command
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
        case 'open':
          await this.openEscrowCase(ctx, args.slice(1));
          break;
        case 'approve':
          await this.approveCase(ctx, args.slice(1));
          break;
        case 'dispute':
          await this.disputeCase(ctx, args.slice(1));
          break;
        case 'resolve':
          await this.resolveCase(ctx, args.slice(1));
          break;
        case 'status':
          await this.getCaseStatus(ctx, args.slice(1));
          break;
        case 'list':
          await this.listCases(ctx);
          break;
        default:
          await this.showUsage(ctx);
      }

    } catch (error) {
      logger.error('Escrow command error', { error, userId: ctx.from?.id });
      await ctx.reply('❌ An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Open a new escrow case
   */
  private async openEscrowCase(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 3) {
      await ctx.reply(
        '❌ **Usage:** /escrow open <amount> <model> <parties> [expiry_days] [remark]\n\n' +
        '**Models:** MultiSig, TimeTiered, Milestones\n\n' +
        '**Examples:**\n' +
        '/escrow open 100 MultiSig sei1abc,sei1def,sei1ghi 7 Business deal\n' +
        '/escrow open 500 TimeTiered sei1abc,sei1def 14 Freelance project\n' +
        '/escrow open 1000 Milestones sei1abc,sei1def,sei1ghi 30 Real estate'
      );
      return;
    }

    const amount = parseFloat(args[0]);
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('❌ Invalid amount. Please provide a positive number.');
      return;
    }

    const model = args[1];
    if (!['MultiSig', 'TimeTiered', 'Milestones'].includes(model)) {
      await ctx.reply('❌ Invalid model. Use: MultiSig, TimeTiered, or Milestones');
      return;
    }

    const partiesStr = args[2];
    const parties = partiesStr.split(',').map(p => p.trim());
    
    // Validate addresses
    for (const party of parties) {
      if (!/^sei1[a-z0-9]{38}$/.test(party)) {
        await ctx.reply(`❌ Invalid Sei address: ${party}`);
        return;
      }
    }

    const expiryDays = args[3] ? parseInt(args[3]) : 7;
    if (isNaN(expiryDays) || expiryDays <= 0) {
      await ctx.reply('❌ Invalid expiry days. Please provide a positive number.');
      return;
    }

    const remark = args.slice(4).join(' ') || undefined;

    // Convert to usei
    const amountUsei = Math.floor(amount * 1000000).toString();
    const expiryTs = Math.floor(Date.now() / 1000) + (expiryDays * 24 * 3600);

    try {
      const result = await this.sdk.openEscrowCase(
        parties,
        amountUsei,
        'usei',
        model as any,
        expiryTs,
        remark
      );

      if (result.success) {
        await ctx.reply(
          `🛡️ **Escrow Case Opened Successfully!**\n\n` +
          `**Amount:** ${amount} SEI (${amountUsei} usei)\n` +
          `**Model:** ${model}\n` +
          `**Parties:** ${parties.length} participants\n` +
          `**Expires:** ${new Date(expiryTs * 1000).toLocaleString()}\n` +
          `**Remark:** ${remark || 'No remark'}\n` +
          `**Transaction Hash:** \`${result.txHash}\`\n\n` +
          `All parties will be notified to participate in the escrow.`,
          { parse_mode: 'Markdown' }
        );

        logger.logTransaction(ctx.from!.id, 'escrow_open', result.txHash!, true);
        logger.logUserActivity(ctx.from!.id, 'escrow_opened', {
          amount: amountUsei,
          model,
          parties,
          expiryTs,
          remark,
          txHash: result.txHash
        });
      } else {
        await ctx.reply(
          `❌ **Escrow Creation Failed**\n\n` +
          `**Error:** ${result.error}\n\n` +
          `Please try again or contact support.`
        );

        logger.logTransaction(ctx.from!.id, 'escrow_open', 'failed', false);
      }
    } catch (error) {
      logger.error('Open escrow error', { error, userId: ctx.from!.id });
      await ctx.reply('❌ Failed to open escrow case. Please try again.');
    }
  }

  /**
   * Approve an escrow case
   */
  private async approveCase(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /escrow approve <case_id>\n\n' +
        '**Examples:**\n' +
        '/escrow approve 123\n' +
        '/escrow approve 456'
      );
      return;
    }

    const caseId = parseInt(args[0]);
    if (isNaN(caseId)) {
      await ctx.reply('❌ Invalid case ID. Please provide a valid number.');
      return;
    }

    try {
      // This would require implementing approveCase in the SDK
      await ctx.reply(
        `✅ **Approve Escrow Case**\n\n` +
        `Escrow approval functionality is coming soon!\n\n` +
        `**Case ID:** #${caseId}\n` +
        `**Status:** Under development\n\n` +
        `This will allow you to:\n` +
        `• Approve case resolution\n` +
        `• Sign multi-signature transactions\n` +
        `• Release escrowed funds\n` +
        `• Complete the agreement`
      );

      logger.logUserActivity(ctx.from!.id, 'escrow_approve_requested', { caseId });
    } catch (error) {
      logger.error('Approve case error', { error, userId: ctx.from!.id, caseId });
      await ctx.reply('❌ Failed to approve case. Please try again.');
    }
  }

  /**
   * Dispute an escrow case
   */
  private async disputeCase(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /escrow dispute <case_id> [reason]\n\n' +
        '**Examples:**\n' +
        '/escrow dispute 123\n' +
        '/escrow dispute 456 Service not delivered as agreed'
      );
      return;
    }

    const caseId = parseInt(args[0]);
    if (isNaN(caseId)) {
      await ctx.reply('❌ Invalid case ID. Please provide a valid number.');
      return;
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      // This would require implementing disputeCase in the SDK
      await ctx.reply(
        `⚠️ **Dispute Escrow Case**\n\n` +
        `Escrow dispute functionality is coming soon!\n\n` +
        `**Case ID:** #${caseId}\n` +
        `**Reason:** ${reason}\n` +
        `**Status:** Under development\n\n` +
        `This will allow you to:\n` +
        `• Raise disputes about agreements\n` +
        `• Provide evidence and reasoning\n` +
        `• Request arbitration\n` +
        `• Protect your interests`
      );

      logger.logUserActivity(ctx.from!.id, 'escrow_dispute_requested', { caseId, reason });
    } catch (error) {
      logger.error('Dispute case error', { error, userId: ctx.from!.id, caseId });
      await ctx.reply('❌ Failed to dispute case. Please try again.');
    }
  }

  /**
   * Resolve an escrow case
   */
  private async resolveCase(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /escrow resolve <case_id>\n\n' +
        '**Examples:**\n' +
        '/escrow resolve 123\n' +
        '/escrow resolve 456'
      );
      return;
    }

    const caseId = parseInt(args[0]);
    if (isNaN(caseId)) {
      await ctx.reply('❌ Invalid case ID. Please provide a valid number.');
      return;
    }

    try {
      // This would require implementing resolveCase in the SDK
      await ctx.reply(
        `🔧 **Resolve Escrow Case**\n\n` +
        `Escrow resolution functionality is coming soon!\n\n` +
        `**Case ID:** #${caseId}\n` +
        `**Status:** Under development\n\n` +
        `This will allow you to:\n` +
        `• Resolve disputed cases\n` +
        `• Execute final settlements\n` +
        `• Distribute funds fairly\n` +
        `• Close completed agreements`
      );

      logger.logUserActivity(ctx.from!.id, 'escrow_resolve_requested', { caseId });
    } catch (error) {
      logger.error('Resolve case error', { error, userId: ctx.from!.id, caseId });
      await ctx.reply('❌ Failed to resolve case. Please try again.');
    }
  }

  /**
   * Get case status
   */
  private async getCaseStatus(ctx: Context, args: string[]): Promise<void> {
    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /escrow status <case_id>\n\n' +
        '**Examples:**\n' +
        '/escrow status 123\n' +
        '/escrow status 456'
      );
      return;
    }

    const caseId = parseInt(args[0]);
    if (isNaN(caseId)) {
      await ctx.reply('❌ Invalid case ID. Please provide a valid number.');
      return;
    }

    try {
      // This would require implementing getCase in the SDK
      await ctx.reply(
        `📊 **Escrow Case Status**\n\n` +
        `Case status functionality is coming soon!\n\n` +
        `**Case ID:** #${caseId}\n` +
        `**Status:** Under development\n\n` +
        `Soon you'll be able to see:\n` +
        `• Current case status\n` +
        `• Participant approvals\n` +
        `• Dispute information\n` +
        `• Timeline and deadlines\n` +
        `• Fund distribution details`
      );

      logger.logUserActivity(ctx.from!.id, 'escrow_status_requested', { caseId });
    } catch (error) {
      logger.error('Get case status error', { error, userId: ctx.from!.id, caseId });
      await ctx.reply('❌ Failed to get case status. Please try again.');
    }
  }

  /**
   * List user's escrow cases
   */
  private async listCases(ctx: Context): Promise<void> {
    try {
      // This would require implementing listCases in the SDK
      await ctx.reply(
        `📋 **Your Escrow Cases**\n\n` +
        `Case listing functionality is coming soon!\n\n` +
        `You'll be able to see:\n` +
        `• All your active cases\n` +
        `• Cases requiring your action\n` +
        `• Completed agreements\n` +
        `• Disputed cases\n` +
        `• Total escrowed amounts`
      );

      logger.logUserActivity(ctx.from!.id, 'escrow_list_requested');
    } catch (error) {
      logger.error('List cases error', { error, userId: ctx.from!.id });
      await ctx.reply('❌ Failed to list cases. Please try again.');
    }
  }

  /**
   * Show escrow usage
   */
  private async showUsage(ctx: Context): Promise<void> {
    const usage = 
      `🛡️ **Escrow Command Usage**\n\n` +
      `**Open Case:**\n` +
      `/escrow open <amount> <model> <parties> [expiry_days] [remark]\n\n` +
      `**Approve Case:**\n` +
      `/escrow approve <case_id>\n\n` +
      `**Dispute Case:**\n` +
      `/escrow dispute <case_id> [reason]\n\n` +
      `**Resolve Case:**\n` +
      `/escrow resolve <case_id>\n\n` +
      `**Status:**\n` +
      `/escrow status <case_id>\n\n` +
      `**List Cases:**\n` +
      `/escrow list\n\n` +
      `**Models:**\n` +
      `• MultiSig - Multi-signature approval\n` +
      `• TimeTiered - Time-based release\n` +
      `• Milestones - Milestone-based payments\n\n` +
      `**Examples:**\n` +
      `/escrow open 100 MultiSig sei1abc,sei1def 7 Business deal\n` +
      `/escrow approve 123\n` +
      `/escrow status 123`;

    await ctx.reply(usage, { parse_mode: 'Markdown' });
  }
}