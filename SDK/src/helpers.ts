/**
 * High-level helper functions for Sei Money SDK
 */

import { Coin, Address, Uint128 } from './types';
import { PaymentsClient } from './clients/payments';
import { retry, formatCoin, parseCoin, addCoins, subtractCoins } from './utils';

/**
 * Send secure transfer with automatic retry
 */
export async function sendSecure(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  remark?: string,
  expiry?: number
) {
  return retry(async () => {
    return await payments.createTransfer(recipient, amount, remark, expiry);
  });
}

/**
 * Send multiple transfers in batch
 */
export async function sendBatch(
  payments: PaymentsClient,
  transfers: Array<{
    recipient: Address;
    amount: Coin;
    remark?: string;
    expiry?: number;
  }>
) {
  const results = [];
  
  for (const transfer of transfers) {
    try {
      const result = await payments.createTransfer(
        transfer.recipient,
        transfer.amount,
        transfer.remark,
        transfer.expiry
      );
      results.push({ ...transfer, success: true, result });
    } catch (error) {
      results.push({ ...transfer, success: false, error });
    }
  }
  
  return results;
}

/**
 * Create scheduled transfer (with expiry)
 */
export async function scheduleTransfer(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  delaySeconds: number,
  remark?: string
) {
  const expiry = Math.floor(Date.now() / 1000) + delaySeconds;
  return await payments.createTransfer(recipient, amount, remark, expiry);
}

/**
 * Send with percentage fee calculation
 */
export async function sendWithFee(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  feePercentage: number,
  remark?: string
) {
  if (feePercentage < 0 || feePercentage > 100) {
    throw new Error('Fee percentage must be between 0 and 100');
  }
  
  const feeAmount = {
    denom: amount.denom,
    amount: Math.floor(parseInt(amount.amount) * (feePercentage / 100)).toString(),
  };
  
  const netAmount = subtractCoins(amount, feeAmount);
  
  return await payments.createTransfer(recipient, netAmount, remark);
}

/**
 * Split amount among multiple recipients
 */
export async function splitTransfer(
  payments: PaymentsClient,
  recipients: Address[],
  totalAmount: Coin,
  remark?: string
) {
  if (recipients.length === 0) {
    throw new Error('At least one recipient is required');
  }
  
  const amountPerRecipient = Math.floor(parseInt(totalAmount.amount) / recipients.length);
  const remainder = parseInt(totalAmount.amount) % recipients.length;
  
  const transfers = recipients.map((recipient, index) => {
    const amount = index === 0 
      ? amountPerRecipient + remainder 
      : amountPerRecipient;
    
    return {
      recipient,
      amount: { denom: totalAmount.denom, amount: amount.toString() },
      remark: remark ? `${remark} (${index + 1}/${recipients.length})` : undefined,
    };
  });
  
  return await sendBatch(payments, transfers);
}

/**
 * Send with automatic expiry based on amount
 */
export async function sendWithAutoExpiry(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  remark?: string
) {
  // Larger amounts get longer expiry times
  const amountValue = parseInt(amount.amount);
  let expiryHours = 24; // Default 24 hours
  
  if (amountValue > 1000000) { // 1M usei
    expiryHours = 168; // 1 week
  } else if (amountValue > 100000) { // 100K usei
    expiryHours = 72; // 3 days
  } else if (amountValue > 10000) { // 10K usei
    expiryHours = 48; // 2 days
  }
  
  const expiry = Math.floor(Date.now() / 1000) + (expiryHours * 3600);
  return await payments.createTransfer(recipient, amount, remark, expiry);
}

/**
 * Send with reminder system
 */
export async function sendWithReminder(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  reminderDays: number = 7,
  remark?: string
) {
  const expiry = Math.floor(Date.now() / 1000) + (reminderDays * 24 * 3600);
  const reminderRemark = remark 
    ? `${remark} (Expires in ${reminderDays} days)`
    : `Transfer expires in ${reminderDays} days`;
  
  return await payments.createTransfer(recipient, amount, reminderRemark, expiry);
}

/**
 * Send with escrow-like behavior
 */
export async function sendWithEscrow(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  escrowDays: number = 30,
  remark?: string
) {
  const expiry = Math.floor(Date.now() / 1000) + (escrowDays * 24 * 3600);
  const escrowRemark = remark 
    ? `${remark} (Escrow: ${escrowDays} days)`
    : `Escrow transfer for ${escrowDays} days`;
  
  return await payments.createTransfer(recipient, amount, escrowRemark, expiry);
}

/**
 * Send with automatic refund notification
 */
export async function sendWithRefundNotification(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  refundHours: number = 24,
  remark?: string
) {
  const expiry = Math.floor(Date.now() / 1000) + (refundHours * 3600);
  const refundRemark = remark 
    ? `${remark} (Auto-refund in ${refundHours}h if unclaimed)`
    : `Auto-refund in ${refundHours} hours if unclaimed`;
  
  return await payments.createTransfer(recipient, amount, refundRemark, expiry);
}

/**
 * Send with conditional expiry
 */
export async function sendWithConditionalExpiry(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  condition: 'business_hours' | 'weekdays' | 'monthly' | 'quarterly',
  remark?: string
) {
  let expiry: number;
  const now = Math.floor(Date.now() / 1000);
  
  switch (condition) {
    case 'business_hours':
      // Expire at end of next business day (5 PM)
      const tomorrow = new Date(now * 1000);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(17, 0, 0, 0); // 5 PM
      expiry = Math.floor(tomorrow.getTime() / 1000);
      break;
      
    case 'weekdays':
      // Expire at end of next weekday
      const nextWeekday = new Date(now * 1000);
      do {
        nextWeekday.setDate(nextWeekday.getDate() + 1);
      } while (nextWeekday.getDay() === 0 || nextWeekday.getDay() === 6);
      nextWeekday.setHours(17, 0, 0, 0); // 5 PM
      expiry = Math.floor(nextWeekday.getTime() / 1000);
      break;
      
    case 'monthly':
      // Expire at end of current month
      const endOfMonth = new Date(now * 1000);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      expiry = Math.floor(endOfMonth.getTime() / 1000);
      break;
      
    case 'quarterly':
      // Expire at end of current quarter
      const endOfQuarter = new Date(now * 1000);
      const quarter = Math.floor(endOfQuarter.getMonth() / 3);
      endOfQuarter.setMonth((quarter + 1) * 3, 0);
      endOfQuarter.setHours(23, 59, 59, 999);
      expiry = Math.floor(endOfQuarter.getTime() / 1000);
      break;
      
    default:
      expiry = now + (24 * 3600); // Default 24 hours
  }
  
  const conditionalRemark = remark 
    ? `${remark} (Expires: ${condition})`
    : `Conditional expiry: ${condition}`;
  
  return await payments.createTransfer(recipient, amount, conditionalRemark, expiry);
}

/**
 * Send with smart amount formatting
 */
export async function sendSmart(
  payments: PaymentsClient,
  recipient: Address,
  amount: string | Coin,
  remark?: string
) {
  const coin = typeof amount === 'string' ? parseCoin(amount) : amount;
  return await payments.createTransfer(recipient, coin, remark);
}

/**
 * Send with automatic denomination conversion
 */
export async function sendConverted(
  payments: PaymentsClient,
  recipient: Address,
  amount: number,
  fromDenom: string,
  toDenom: string,
  exchangeRate: number,
  remark?: string
) {
  const convertedAmount = Math.floor(amount * exchangeRate);
  const coin: Coin = {
    denom: toDenom,
    amount: convertedAmount.toString(),
  };
  
  const conversionRemark = remark 
    ? `${remark} (Converted: ${amount} ${fromDenom} → ${convertedAmount} ${toDenom})`
    : `Converted: ${amount} ${fromDenom} → ${convertedAmount} ${toDenom}`;
  
  return await payments.createTransfer(recipient, coin, conversionRemark);
}
