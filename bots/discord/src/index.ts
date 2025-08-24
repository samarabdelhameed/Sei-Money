/**
 * SeiMoney Discord Bot - Main Entry Point
 */

import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
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
  token: process.env.DISCORD_BOT_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  guildId: process.env.DISCORD_GUILD_ID,
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

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

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

// Define slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('bind')
    .setDescription('Connect your Sei wallet')
    .addStringOption(option =>
      option.setName('address')
        .setDescription('Your Sei wallet address')
        .setRequired(true)
    ),
  
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check your wallet status'),
  
  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your wallet balance'),
  
  new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Send a protected transfer')
    .addStringOption(option =>
      option.setName('recipient')
        .setDescription('Recipient Sei address')
        .setRequired(true)
    )
    .addNumberOption(option =>
      option.setName('amount')
        .setDescription('Amount in SEI')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('remark')
        .setDescription('Optional remark')
        .setRequired(false)
    ),
  
  new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim a transfer')
    .addIntegerOption(option =>
      option.setName('transfer_id')
        .setDescription('Transfer ID to claim')
        .setRequired(true)
    ),
  
  new SlashCommandBuilder()
    .setName('refund')
    .setDescription('Refund an expired transfer')
    .addIntegerOption(option =>
      option.setName('transfer_id')
        .setDescription('Transfer ID to refund')
        .setRequired(true)
    ),
  
  new SlashCommandBuilder()
    .setName('pool')
    .setDescription('Pool management commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a funding pool')
        .addNumberOption(option =>
          option.setName('target')
            .setDescription('Target amount in SEI')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('memo')
            .setDescription('Pool description')
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option.setName('expiry_hours')
            .setDescription('Expiry in hours (default: 24)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('contribute')
        .setDescription('Contribute to a pool')
        .addIntegerOption(option =>
          option.setName('pool_id')
            .setDescription('Pool ID')
            .setRequired(true)
        )
        .addNumberOption(option =>
          option.setName('amount')
            .setDescription('Amount in SEI')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Check pool status')
        .addIntegerOption(option =>
          option.setName('pool_id')
            .setDescription('Pool ID')
            .setRequired(true)
        )
    ),
  
  new SlashCommandBuilder()
    .setName('pot')
    .setDescription('Savings pot commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('open')
        .setDescription('Open a savings pot')
        .addNumberOption(option =>
          option.setName('goal')
            .setDescription('Savings goal in SEI')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('label')
            .setDescription('Pot label')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('deposit')
        .setDescription('Deposit to a pot')
        .addIntegerOption(option =>
          option.setName('pot_id')
            .setDescription('Pot ID')
            .setRequired(true)
        )
        .addNumberOption(option =>
          option.setName('amount')
            .setDescription('Amount in SEI')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Check pot status')
        .addIntegerOption(option =>
          option.setName('pot_id')
            .setDescription('Pot ID')
            .setRequired(true)
        )
    ),
  
  new SlashCommandBuilder()
    .setName('vault')
    .setDescription('Yield vault commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a yield vault')
        .addStringOption(option =>
          option.setName('label')
            .setDescription('Vault label')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('strategy')
            .setDescription('Yield strategy')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('deposit')
        .setDescription('Deposit to vault')
        .addIntegerOption(option =>
          option.setName('vault_id')
            .setDescription('Vault ID')
            .setRequired(true)
        )
        .addNumberOption(option =>
          option.setName('amount')
            .setDescription('Amount in SEI')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Check vault status')
        .addIntegerOption(option =>
          option.setName('vault_id')
            .setDescription('Vault ID')
            .setRequired(true)
        )
    ),
];

// Register slash commands
const rest = new REST({ version: '10' }).setToken(config.token);

async function deployCommands() {
  try {
    logger.info('Started refreshing application (/) commands.');

    const route = config.guildId 
      ? Routes.applicationGuildCommands(config.clientId, config.guildId)
      : Routes.applicationCommands(config.clientId);

    await rest.put(route, { body: commands });

    logger.info('Successfully reloaded application (/) commands.');
  } catch (error) {
    logger.error('Failed to deploy commands', { error });
  }
}

// Bot ready event
client.once('ready', async () => {
  logger.info(`🚀 SeiMoney Discord Bot logged in as ${client.user?.tag}!`);
  logger.info(`🔗 RPC URL: ${config.rpcUrl}`);
  logger.info(`💰 Payments Contract: ${config.contracts.payments}`);
  
  await deployCommands();
});

// Handle slash command interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    // Log command usage
    logger.logCommand(
      interaction.user.id, 
      commandName, 
      interaction.options.data.map(opt => opt.value?.toString() || ''), 
      true
    );

    switch (commandName) {
      case 'bind':
        await handleBindCommand(interaction);
        break;
      case 'status':
        await handleStatusCommand(interaction);
        break;
      case 'balance':
        await handleBalanceCommand(interaction);
        break;
      case 'transfer':
        await transferCommand.handle(interaction);
        break;
      case 'claim':
        await claimCommand.handle(interaction);
        break;
      case 'refund':
        await refundCommand.handle(interaction);
        break;
      case 'pool':
        await poolCommand.handle(interaction);
        break;
      case 'pot':
        await potCommand.handle(interaction);
        break;
      case 'vault':
        await vaultCommand.handle(interaction);
        break;
      default:
        await interaction.reply({
          content: '❌ Unknown command',
          ephemeral: true
        });
    }
  } catch (error) {
    logger.error('Command execution error', { 
      error, 
      userId: interaction.user.id, 
      command: commandName 
    });
    
    const errorMessage = '❌ An unexpected error occurred. Please try again.';
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

// Handle bind command
async function handleBindCommand(interaction: ChatInputCommandInteraction) {
  const address = interaction.options.getString('address', true);
  
  // Validate address format
  if (!/^sei1[a-z0-9]{38}$/.test(address)) {
    await interaction.reply({
      content: '❌ Invalid Sei address format. Please provide a valid address starting with "sei1".',
      ephemeral: true
    });
    return;
  }

  const success = await sessionManager.bindSeiAddress(interaction.user.id, address);
  
  if (success) {
    await interaction.reply({
      content: `✅ **Wallet Connected Successfully!**\n\n` +
               `**Address:** \`${address}\`\n\n` +
               `You can now use all DeFi services with slash commands!`,
      ephemeral: true
    });

    logger.logUserActivity(interaction.user.id, 'wallet_bound', { seiAddress: address });
  } else {
    await interaction.reply({
      content: '❌ Failed to bind wallet. Please try again.',
      ephemeral: true
    });
  }
}

// Handle status command
async function handleStatusCommand(interaction: ChatInputCommandInteraction) {
  const session = await sessionManager.getUserSession(interaction.user.id);
  
  if (!session) {
    await interaction.reply({
      content: '❌ No session found. Please use `/bind` to connect your wallet.',
      ephemeral: true
    });
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
    statusMessage += `• \`/transfer\` - Send money\n`;
    statusMessage += `• \`/pool\` - Group funding\n`;
    statusMessage += `• \`/pot\` - Savings goals\n`;
    statusMessage += `• \`/vault\` - Yield farming\n`;
  } else {
    statusMessage += `❌ **No Wallet Connected**\n\n`;
    statusMessage += `Use \`/bind <sei_address>\` to connect your wallet.\n\n`;
  }

  await interaction.reply({
    content: statusMessage,
    ephemeral: true
  });
}

// Handle balance command
async function handleBalanceCommand(interaction: ChatInputCommandInteraction) {
  const session = await sessionManager.getUserSession(interaction.user.id);
  
  if (!session?.isBound) {
    await interaction.reply({
      content: '❌ You need to bind your wallet first. Use `/bind <sei_address>`',
      ephemeral: true
    });
    return;
  }

  try {
    const balance = await sdk.getBalance(session.seiAddress!);
    const balanceSei = (parseInt(balance) / 1000000).toFixed(6);

    await interaction.reply({
      content: `💰 **Wallet Balance**\n\n` +
               `**Address:** \`${session.seiAddress}\`\n` +
               `**Balance:** ${balanceSei} SEI\n` +
               `**Raw Balance:** ${balance} usei`,
      ephemeral: true
    });

    logger.logUserActivity(interaction.user.id, 'balance_checked', { balance });
  } catch (error) {
    logger.error('Balance command error', { error, userId: interaction.user.id });
    await interaction.reply({
      content: '❌ Unable to fetch balance. Please try again.',
      ephemeral: true
    });
  }
}

// Error handling
client.on('error', (error) => {
  logger.error('Discord client error', { error });
});

// Graceful shutdown
process.once('SIGINT', () => {
  logger.info('Shutting down Discord bot...');
  client.destroy();
  sessionManager.close();
});

process.once('SIGTERM', () => {
  logger.info('Shutting down Discord bot...');
  client.destroy();
  sessionManager.close();
});

// Start the bot
client.login(config.token).then(() => {
  logger.info('🚀 SeiMoney Discord Bot started successfully!');
}).catch((error) => {
  logger.error('Failed to start Discord bot', { error });
  process.exit(1);
});