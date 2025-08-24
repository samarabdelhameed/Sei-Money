import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple test bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || 'test_token');

// Start command
bot.start(async (ctx) => {
  await ctx.reply('🚀 Hello! This is a test bot for SeiMoney.');
});

// Help command
bot.help(async (ctx) => {
  await ctx.reply('This is a test bot. Use /start to begin.');
});

// Echo command
bot.on('text', async (ctx) => {
  const message = ctx.message?.text || 'No text';
  await ctx.reply(`Echo: ${message}`);
});

// Launch bot
bot.launch()
  .then(() => {
    console.log('✅ Test bot is running!');
    console.log('Bot token:', process.env.TEGRAM_BOT_TOKEN ? 'Set' : 'Not set');
    console.log('RPC URL:', process.env.SEI_RPC_URL || 'Default');
  })
  .catch((error) => {
    console.error('❌ Failed to start bot:', error);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
