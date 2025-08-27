import TelegramBot from 'node-telegram-bot-api';
import nodemailer from 'nodemailer';
import webpush from 'web-push';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

// Notification channels
export enum NotificationChannel {
  TELEGRAM = 'telegram',
  EMAIL = 'email',
  WEBPUSH = 'webpush'
}

// Notification templates
export enum NotificationTemplate {
  TRANSFER_CREATED = 'TRANSFER_CREATED',
  TRANSFER_CLAIMABLE = 'TRANSFER_CLAIMABLE',
  TRANSFER_REFUNDED = 'TRANSFER_REFUNDED',
  POOL_TARGET_REACHED = 'POOL_TARGET_REACHED',
  POOL_DISTRIBUTED = 'POOL_DISTRIBUTED',
  ESCROW_DISPUTED = 'ESCROW_DISPUTED',
  ESCROW_RESOLVED = 'ESCROW_RESOLVED',
  VAULT_HARVESTED = 'VAULT_HARVESTED',
  VAULT_REBALANCED = 'VAULT_REBALANCED'
}

// Notification payload interface
export interface NotificationPayload {
  user: string; // sei1... address or username
  event: NotificationTemplate;
  data: Record<string, any>;
  cta?: string; // Call to action URL
}

// Initialize services
let telegramBot: TelegramBot | null = null;
let emailTransporter: nodemailer.Transporter | null = null;

// Initialize Telegram bot
function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn('TELEGRAM_BOT_TOKEN not set, Telegram notifications disabled');
    return;
  }

  try {
    telegramBot = new TelegramBot(token, { polling: false });
    logger.info('Telegram bot initialized');
  } catch (error) {
    logger.error('Failed to initialize Telegram bot:', error);
  }
}

// Initialize email transporter
function initEmailTransporter() {
  const smtpUrl = process.env.SMTP_URL;
  if (!smtpUrl) {
    logger.warn('SMTP_URL not set, email notifications disabled');
    return;
  }

  try {
    emailTransporter = nodemailer.createTransport(smtpUrl);
    logger.info('Email transporter initialized');
  } catch (error) {
    logger.error('Failed to initialize email transporter:', error);
  }
}

// Initialize WebPush
function initWebPush() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  
  if (!vapidPublicKey || !vapidPrivateKey) {
    logger.warn('VAPID keys not set, WebPush notifications disabled');
    return;
  }

  try {
    webpush.setVapidDetails(
      'mailto:notifications@seimoney.xyz',
      vapidPublicKey,
      vapidPrivateKey
    );
    logger.info('WebPush initialized');
  } catch (error) {
    logger.error('Failed to initialize WebPush:', error);
  }
}

// Send Telegram notification
async function sendTelegram(chatId: string, text: string): Promise<boolean> {
  if (!telegramBot) {
    logger.warn('Telegram bot not initialized');
    return false;
  }

  try {
    await telegramBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    return true;
  } catch (error) {
    logger.error('Failed to send Telegram message:', error);
    return false;
  }
}

// Send email notification
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!emailTransporter) {
    logger.warn('Email transporter not initialized');
    return false;
  }

  try {
    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'notifications@seimoney.xyz',
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    logger.error('Failed to send email:', error);
    return false;
  }
}

// Send WebPush notification
async function sendWebPush(subscription: any, payload: string): Promise<boolean> {
  try {
    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (error) {
    logger.error('Failed to send WebPush notification:', error);
    return false;
  }
}

// Generate notification text from template
function generateNotificationText(template: NotificationTemplate, data: Record<string, any>): string {
  switch (template) {
    case NotificationTemplate.TRANSFER_CREATED:
      return `🟢 Transfer #${data.transferId} created\nAmount: ${data.amount} ${data.denom}\nRecipient: ${data.recipient}`;
    
    case NotificationTemplate.TRANSFER_CLAIMABLE:
      return `💰 Transfer #${data.transferId} ready to claim!\nAmount: ${data.amount} ${data.denom}\nFrom: ${data.sender}`;
    
    case NotificationTemplate.TRANSFER_REFUNDED:
      return `↩️ Transfer #${data.transferId} refunded\nAmount: ${data.amount} ${data.denom}`;
    
    case NotificationTemplate.POOL_TARGET_REACHED:
      return `🎯 Pool "${data.name}" target reached!\nCurrent: ${data.current} ${data.denom}\nTarget: ${data.target} ${data.denom}`;
    
    case NotificationTemplate.POOL_DISTRIBUTED:
      return `🎉 Pool "${data.name}" distributed!\nTotal: ${data.total} ${data.denom}\nRecipients: ${data.recipients}`;
    
    case NotificationTemplate.ESCROW_DISPUTED:
      return `⚠️ Escrow case #${data.caseId} disputed\nReason: ${data.reason}\nAmount: ${data.amount} ${data.denom}`;
    
    case NotificationTemplate.ESCROW_RESOLVED:
      return `✅ Escrow case #${data.caseId} resolved\nDecision: ${data.decision}\nAmount: ${data.amount} ${data.denom}`;
    
    case NotificationTemplate.VAULT_HARVESTED:
      return `🌾 Vault "${data.label}" harvested\nAPR: ${data.apr}%\nTVL: ${data.tvl} ${data.denom}`;
    
    case NotificationTemplate.VAULT_REBALANCED:
      return `⚖️ Vault "${data.label}" rebalanced\nNew allocation: ${JSON.stringify(data.allocation)}`;
    
    default:
      return `Notification: ${template}`;
  }
}

// Generate email HTML
function generateEmailHTML(template: NotificationTemplate, data: Record<string, any>, cta?: string): string {
  const text = generateNotificationText(template, data);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>SeiMoney Notification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .cta { text-align: center; margin: 20px 0; }
        .cta a { background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SeiMoney</h1>
        </div>
        <div class="content">
          <p>${text.replace(/\n/g, '<br>')}</p>
          ${cta ? `<div class="cta"><a href="${cta}">View Details</a></div>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

// Main notification function
export async function sendNotification(
  userId: string,
  channel: NotificationChannel,
  template: NotificationTemplate,
  payload: Record<string, any>,
  cta?: string
): Promise<boolean> {
  try {
    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { notifications: true }
    });

    if (!user) {
      logger.warn(`User ${userId} not found`);
      return false;
    }

    // Type assertion since we've already checked user is not null
    const validUser = user!;

    // Check if user has this channel enabled
    const userChannel = validUser.notifications.find(n => n.channels.includes(channel));
    if (!userChannel || true) {
      logger.debug(`Channel ${channel} not enabled for user ${userId}`);
      return false;
    }

    let success = false;

    switch (channel) {
      case NotificationChannel.TELEGRAM:
        if ((validUser as any).telegramChatId) {
          const text = generateNotificationText(template, payload);
          success = await sendTelegram((validUser as any).telegramChatId, text);
        }
        break;

      case NotificationChannel.EMAIL:
        if (validUser.email) {
          const subject = `SeiMoney: ${template.replace(/_/g, ' ')}`;
          const html = generateEmailHTML(template, payload, cta);
          success = await sendEmail(validUser.email as string, subject, html);
        }
        break;

      case NotificationChannel.WEBPUSH:
        if ((validUser as any).webpushSubscription) {
          const pushPayload = JSON.stringify({
            title: `SeiMoney: ${template.replace(/_/g, ' ')}`,
            body: generateNotificationText(template, payload),
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: { url: cta }
          });
          success = await sendWebPush(JSON.parse((validUser as any).webpushSubscription), pushPayload);
        }
        break;
    }

    // Log notification
    await prisma.notification.create({
      data: {
        userId,
        type: template,
        title: `SeiMoney: ${template.replace(/_/g, ' ')}`,
        message: generateNotificationText(template, payload),
        data: JSON.stringify(payload),
        channels: channel,
        status: success ? 'SENT' : 'FAILED',
        sentAt: success ? new Date() : null
      }
    });

    return success;
  } catch (error) {
    logger.error('Failed to send notification:', error);
    return false;
  }
}

// Batch notification function
export async function sendBatchNotifications(
  notifications: Array<{
    userId: string;
    channel: NotificationChannel;
    template: NotificationTemplate;
    payload: Record<string, any>;
    cta?: string;
  }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const notification of notifications) {
    try {
      const result = await sendNotification(
        notification.userId,
        notification.channel,
        notification.template,
        notification.payload,
        notification.cta
      );
      
      if (result) {
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      logger.error('Failed to send batch notification:', error);
      failed++;
    }
  }

  return { success, failed };
}

// Initialize notification service
export async function initNotifier(): Promise<void> {
  logger.info('Initializing notification service...');
  
  initTelegramBot();
  initEmailTransporter();
  initWebPush();
  
  logger.info('Notification service initialized');
}

// Test notification function
export async function testNotification(
  userId: string,
  channel: NotificationChannel
): Promise<boolean> {
  return sendNotification(
    userId,
    channel,
    NotificationTemplate.TRANSFER_CREATED,
    {
      transferId: 'test-123',
      amount: '1000000',
      denom: 'usei',
      recipient: 'sei1...'
    },
    'https://app.seimoney.xyz'
  );
}
