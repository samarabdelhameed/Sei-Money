/**
 * SeiMoney Telegram Bot - Main Entry Point
 */

import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { BotConfig } from './types';
import { SeiMoneyBotSDK } from './lib/sdk';
import { SessionManager } from './lib/session';
import { logger } from './lib/logger';

// Import commands
import { TransferCommand } from './commands/transfer';
import { ClaimCommand } from './commands/claim';
import { RefundCommand } from './commands/refund';
import { PoolCommand } from './commands/pool';
import { PotCommand } from './commands/pot';
import { EscrowCommand } from './commands/escrow';
import { VaultCommand } from './commands/vault';

// Load environment variables
dotenv.config();

// Bot configuration
const config: BotConfig = {
  token: process.env.TELEGRAM_BOT_TOKEN || 'dummy-token-for-development',
  rpcUrl: process.env.SEI_RPC_URL || 'https://sei-testnet-rpc.polkachu.com',
  contracts: {
    payments: process.env.CONTRACT_PAYMENTS || 'sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg',
    groups: process.env.CONTRACT_GROUPS || 'sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt',
    pots: process.env.CONTRACT_POTS || 'sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj',
    alias: process.env.CONTRACT_ALIAS || 'sei1thjuavd70uq7txe79uj8pfy2vfyl3zvmenkyxh6ew4vag9mckq4qrtjav4',
    riskEscrow: process.env.CONTRACT_RISK_ESCROW || 'sei1q3gqr9ywvma6j6kja67n4h7fxz790x5lhj4v5phv2za0v7wsp5qqkrz0pj',
    vaults: process.env.CONTRACT_VAULTS || 'sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/seimoney',
  },
};

// Initialize bot
const bot = new Telegraf(config.token);

// Initialize services
const sdk = new SeiMoneyBotSDK(config);
const sessionManager = new SessionManager(`redis://${config.redis.host}:${config.redis.port}`);

// Initialize commands
const transferCommand = new TransferCommand(sdk, sessionManager);
const claimCommand = new ClaimCommand(sdk, sessionManager);
const refundCommand = new RefundCommand(sdk, sessionManager);
const poolCommand = new PoolCommand(sdk, sessionManager);
const potCommand = new PotCommand(sdk, sessionManager);
const escrowCommand = new EscrowCommand(sdk, sessionManager);
const vaultCommand = new VaultCommand(sdk, sessionManager);

// Middleware for logging
bot.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  
  logger.info('Request processed', {
    userId: ctx.from?.id,
    username: ctx.from?.username,
    command: ctx.message && 'text' in ctx.message ? ctx.message.text : 'unknown',
    responseTime: ms,
  });
});

// Start command
bot.start(async (ctx) => {
  const welcomeMessage = 
    `🐒💰 **Welcome to SeiMoney Bot!**\n\n` +
    `Your gateway to Sei Network DeFi services.\n\n` +
    `**Available Commands:**\n` +
    `💰 /transfer - Send protected transfers\n` +
    `🎉 /claim - Claim transfers\n` +
    `💸 /refund - Refund expired transfers\n` +
    `👥 /pool - Group funding pools\n` +
    `🏺 /pot - Savings goals\n` +
    `🛡️ /escrow - Multi-party escrow\n` +
    `🏦 /vault - Yield farming vaults\n` +
    `🔗 /bind - Connect your wallet\n` +
    `📊 /status - Check your status\n` +
    `❓ /help - Show all commands\n\n` +
    `**First Steps:**\n` +
    `1. Use /bind <your_sei_address> to connect your wallet\n` +
    `2. Start using DeFi services!\n\n` +
    `**Need Help?**\n` +
    `Use /help for detailed command information.`;

  await ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
  
  // Create user session
  if (ctx.from) {
    await sessionManager.setUserSession(ctx.from.id, {
      userId: `user_${ctx.from.id}`,
      telegramId: ctx.from.id,
      username: ctx.from.username,
      isBound: false,
      lastActivity: new Date(),
      preferences: {
        notifications: true,
        language: 'en',
        timezone: 'UTC'
      }
    });
    
    logger.logUserActivity(ctx.from.id, 'bot_started');
  }
});

// Help command
bot.help(async (ctx) => {
  const helpMessage = 
    `❓ **SeiMoney Bot Help**\n\n` +
    `**💰 Transfer Commands:**\n` +
    `/transfer <recipient> <amount> [remark] - Send protected transfer\n` +
    `/claim <transfer_id> - Claim a transfer\n` +
    `/refund <transfer_id> - Refund expired transfer\n\n` +
    `**👥 Pool Commands:**\n` +
    `/pool create <target> [memo] [expiry_hours] - Create funding pool\n` +
    `/pool contribute <pool_id> <amount> - Contribute to pool\n` +
    `/pool distribute <pool_id> - Distribute pool funds\n` +
    `/pool status <pool_id> - Check pool status\n` +
    `/pool list - List all pools\n\n` +
    `**🏺 Pot Commands:**\n` +
    `/pot open <goal> [label] - Open savings pot\n` +
    `/pot deposit <pot_id> <amount> - Add to pot\n` +
    `/pot break <pot_id> - Break pot (get funds back)\n` +
    `/pot close <pot_id> - Close pot when goal reached\n` +
    `/pot status <pot_id> - Check pot status\n` +
    `/pot list - List all pots\n\n` +
    `**🛡️ Escrow Commands:**\n` +
    `/escrow open <amount> <model> <parties> [expiry_days] [remark] - Open escrow case\n` +
    `/escrow approve <case_id> - Approve case\n` +
    `/escrow dispute <case_id> [reason] - Dispute case\n` +
    `/escrow status <case_id> - Check case status\n\n` +
    `**🏦 Vault Commands:**\n` +
    `/vault create <label> <denom> [strategy] [fee_percent] - Create yield vault\n` +
    `/vault deposit <vault_id> <amount> - Deposit to vault\n` +
    `/vault withdraw <vault_id> <shares> - Withdraw from vault\n` +
    `/vault harvest <vault_id> - Harvest yields\n` +
    `/vault status <vault_id> - Check vault status\n` +
    `/vault list - List all vaults\n\n` +
    `**🔧 Utility Commands:**\n` +
    `/bind <sei_address> - Connect your wallet\n` +
    `/status - Check your status\n` +
    `/balance - Check your balance\n\n` +
    `**Examples:**\n` +
    `/transfer sei1abc... 10.5 Payment for services\n` +
    `/pool create 100 Team funding 48\n` +
    `/pot open 500 Vacation fund\n` +
    `/escrow open 100 MultiSig sei1abc,sei1def,sei1ghi 7 Business deal\n` +
    `/vault create MyVault usei staking 1.5`;

  await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
});

// Bind wallet command
bot.command('bind', async (ctx) => {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply('❌ Unable to identify user');
      return;
    }

    const text = ctx.message?.text || '';
    const args = text.split(' ').slice(1);

    if (args.length < 1) {
      await ctx.reply(
        '❌ **Usage:** /bind <your_sei_address>\n\n' +
        '**Example:**\n' +
        '/bind sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg'
      );
      return;
    }

    const seiAddress = args[0];
    
    // Validate address format
    if (!/^sei1[a-z0-9]{38}$/.test(seiAddress)) {
      await ctx.reply('❌ Invalid Sei address format. Please provide a valid address starting with "sei1".');
      return;
    }

    // Bind the address
    const success = await sessionManager.bindSeiAddress(telegramId, seiAddress);
    
    if (success) {
      await ctx.reply(
        `✅ **Wallet Connected Successfully!**\n\n` +
        `**Address:** \`${seiAddress}\`\n\n` +
        `You can now use all DeFi services:\n` +
        `• /transfer - Send money\n` +
        `• /pool - Create funding pools\n` +
        `• /pot - Open savings goals\n` +
        `• /escrow - Multi-party escrow\n` +
        `• /vault - Yield farming\n\n` +
        `Use /help to see all available commands!`
      );

      logger.logUserActivity(telegramId, 'wallet_bound', { seiAddress });
    } else {
      await ctx.reply('❌ Failed to bind wallet. Please try again.');
    }

  } catch (error) {
    logger.error('Bind command error', { error, userId: ctx.from?.id });
    await ctx.reply('❌ An unexpected error occurred. Please try again.');
  }
});

// Unbind wallet command
bot.command('unbind', async (ctx) => {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply('❌ Unable to identify user');
      return;
    }

    const success = await sessionManager.unbindSeiAddress(telegramId);
    
    if (success) {
      await ctx.reply(
        `🔓 **Wallet Disconnected Successfully!**\n\n` +
        `Your wallet has been unbound.\n` +
        `Use /bind <sei_address> to connect a new wallet.`
      );

      logger.logUserActivity(telegramId, 'wallet_unbound');
    } else {
      await ctx.reply('❌ No wallet was bound to your account.');
    }

  } catch (error) {
    logger.error('Unbind command error', { error, userId: ctx.from?.id });
    await ctx.reply('❌ An unexpected error occurred. Please try again.');
  }
});

// Status command
bot.command('status', async (ctx) => {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply('❌ Unable to identify user');
      return;
    }

    const session = await sessionManager.getUserSession(telegramId);
    
    if (!session) {
      await ctx.reply('❌ No session found. Please use /start to begin.');
      return;
    }

    let statusMessage = `📊 **Your Status**\n\n`;
    
    if (session.isBound && session.seiAddress) {
      statusMessage += `✅ **Wallet Connected**\n`;
      statusMessage += `**Address:** \`${session.seiAddress}\`\n\n`;
      
      // Get balance
      try {
        const balance = await sdk.getBalance(session.seiAddress);
        const balanceSei = (parseInt(balance) / 1000000).toFixed(6);
        statusMessage += `💰 **Balance:** ${balanceSei} SEI\n\n`;
      } catch (error) {
        statusMessage += `💰 **Balance:** Unable to fetch\n\n`;
      }
      
      statusMessage += `**Available Commands:**\n`;
      statusMessage += `• /transfer - Send money\n`;
      statusMessage += `• /pool - Group funding\n`;
      statusMessage += `• /pot - Savings goals\n`;
      statusMessage += `• /escrow - Multi-party escrow\n`;
      statusMessage += `• /vault - Yield farming\n`;
    } else {
      statusMessage += `❌ **No Wallet Connected**\n\n`;
      statusMessage += `Use /bind <sei_address> to connect your wallet.\n\n`;
      statusMessage += `**Available Commands:**\n`;
      statusMessage += `• /bind - Connect wallet\n`;
      statusMessage += `• /help - Show commands\n`;
    }

    await ctx.reply(statusMessage, { parse_mode: 'Markdown' });

  } catch (error) {
    logger.error('Status command error', { error, userId: ctx.from?.id });
    await ctx.reply('❌ An unexpected error occurred. Please try again.');
  }
});

// Balance command
bot.command('balance', async (ctx) => {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply('❌ Unable to identify user');
      return;
    }

    const session = await sessionManager.getUserSession(telegramId);
    if (!session?.isBound) {
      await ctx.reply('❌ You need to bind your wallet first. Use /bind <sei_address>');
      return;
    }

    const balance = await sdk.getBalance(session.seiAddress!);
    const balanceSei = (parseInt(balance) / 1000000).toFixed(6);

    await ctx.reply(
      `💰 **Wallet Balance**\n\n` +
      `**Address:** \`${session.seiAddress}\`\n` +
      `**Balance:** ${balanceSei} SEI\n` +
      `**Raw Balance:** ${balance} usei\n\n` +
      `Use /transfer to send money or /pool to create funding pools!`
    );

    logger.logUserActivity(telegramId, 'balance_checked', { balance });

  } catch (error) {
    logger.error('Balance command error', { error, userId: ctx.from?.id });
    await ctx.reply('❌ Unable to fetch balance. Please try again.');
  }
});

// Register command handlers
bot.command('transfer', (ctx) => transferCommand.handle(ctx));
bot.command('claim', (ctx) => claimCommand.handle(ctx));
bot.command('refund', (ctx) => refundCommand.handle(ctx));
bot.command('pool', (ctx) => poolCommand.handle(ctx));
bot.command('pot', (ctx) => potCommand.handle(ctx));
bot.command('escrow', (ctx) => escrowCommand.handle(ctx));
bot.command('vault', (ctx) => vaultCommand.handle(ctx));

// Error handling
bot.catch((err, ctx) => {
  logger.error('Bot error', { error: err, userId: ctx.from?.id });
  ctx.reply('❌ An unexpected error occurred. Please try again later.');
});

// Graceful shutdown
process.once('SIGINT', () => {
  logger.info('Shutting down bot...');
  bot.stop('SIGINT');
  sessionManager.close();
});

process.once('SIGTERM', () => {
  logger.info('Shutting down bot...');
  bot.stop('SIGTERM');
  sessionManager.close();
});

// Start the bot
bot.launch().then(() => {
  logger.info('🚀 SeiMoney Telegram Bot started successfully!');
  logger.info(`📱 Bot username: @${bot.botInfo?.username}`);
  logger.info(`🔗 RPC URL: ${config.rpcUrl}`);
  logger.info(`💰 Payments Contract: ${config.contracts.payments}`);
}).catch((error) => {
  logger.error('Failed to start bot', { error });
  process.exit(1);
});
