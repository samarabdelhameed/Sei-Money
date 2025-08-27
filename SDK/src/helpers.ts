/**
 * Helper functions for common operations
 */

import { PaymentsClient } from './clients/payments';
import { Coin, Address, Uint64 } from './types';

/**
 * Send a simple transfer with remark
 */
export async function sendWithRemark(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  remark: string,
  expiry?: Uint64
) {
  const options: any = { remark };
  if (expiry !== undefined) options.expiry = expiry;
  return await payments.createTransfer(recipient, amount, options);
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
    expiry?: Uint64;
  }>
) {
  const results = [];
  for (const transfer of transfers) {
    const options: any = {};
    if (transfer.remark) options.remark = transfer.remark;
    if (transfer.expiry !== undefined) options.expiry = transfer.expiry;
    
    const result = await payments.createTransfer(
      transfer.recipient,
      transfer.amount,
      options
    );
    results.push(result);
  }
  return results;
}

/**
 * Send with automatic expiry (24 hours)
 */
export async function sendWithAutoExpiry(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  remark?: string
) {
  const expiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours
  const options: any = { expiry };
  if (remark) options.remark = remark;
  return await payments.createTransfer(recipient, amount, options);
}

/**
 * Send with fee deduction
 */
export async function sendWithFeeDeduction(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  feePercentage: number,
  remark?: string
) {
  const fee = Math.floor(parseFloat(amount.amount) * feePercentage / 100);
  const netAmount = {
    ...amount,
    amount: (parseFloat(amount.amount) - fee).toString()
  };
  const options: any = {};
  if (remark) options.remark = remark;
  return await payments.createTransfer(recipient, netAmount, options);
}

/**
 * Split amount among multiple recipients
 */
export async function splitSend(
  payments: PaymentsClient,
  recipients: Address[],
  totalAmount: Coin,
  remark?: string
) {
  const amountPerRecipient = Math.floor(parseFloat(totalAmount.amount) / recipients.length);
  
  const transfers = recipients.map((recipient, index) => {
    const amount = (amountPerRecipient).toString();
    const transfer: any = {
      recipient,
      amount: { denom: totalAmount.denom, amount: amount.toString() },
    };
    if (remark) transfer.remark = `${remark} (${index + 1}/${recipients.length})`;
    return transfer;
  });
  
  return await sendBatch(payments, transfers);
}

/**
 * Send with automatic expiry based on amount
 */
export async function sendWithSmartExpiry(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  remark?: string
) {
  // Larger amounts get longer expiry times
  const amountValue = parseFloat(amount.amount);
  let expiryHours = 24; // Default 24 hours
  
  if (amountValue > 1000000) expiryHours = 72; // 3 days for large amounts
  else if (amountValue > 100000) expiryHours = 48; // 2 days for medium amounts
  
  const expiry = Math.floor(Date.now() / 1000) + expiryHours * 60 * 60;
  const options: any = { expiry };
  if (remark) options.remark = remark;
  return await payments.createTransfer(recipient, amount, options);
}

/**
 * Send with reminder remark
 */
export async function sendWithReminder(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  originalRemark: string,
  expiry?: Uint64
) {
  const reminderRemark = `REMINDER: ${originalRemark}`;
  const options: any = { remark: reminderRemark };
  if (expiry !== undefined) options.expiry = expiry;
  return await payments.createTransfer(recipient, amount, options);
}

/**
 * Send with escrow-like remark
 */
export async function sendWithEscrow(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  terms: string,
  expiry?: Uint64
) {
  const escrowRemark = `ESCROW: ${terms}`;
  const options: any = { remark: escrowRemark };
  if (expiry !== undefined) options.expiry = expiry;
  return await payments.createTransfer(recipient, amount, options);
}

/**
 * Send with refund protection
 */
export async function sendWithRefundProtection(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  protectionPeriod: number, // in seconds
  remark?: string
) {
  const expiry = Math.floor(Date.now() / 1000) + protectionPeriod;
  const refundRemark = remark ? `${remark} (Refund protected)` : 'Refund protected';
  return await payments.createTransfer(recipient, amount, { remark: refundRemark, expiry });
}

/**
 * Send recurring payment setup
 */
export async function setupRecurringPayment(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  intervalDays: number,
  totalPayments: number,
  remark?: string
) {
  const results = [];
  
  for (let i = 0; i < totalPayments; i++) {
    const paymentDate = new Date();
    paymentDate.setDate(paymentDate.getDate() + (i * intervalDays));
    
    const recurringRemark = remark 
      ? `${remark} (Payment ${i + 1}/${totalPayments})`
      : `Recurring payment ${i + 1}/${totalPayments}`;
    
    // For now, we'll create all payments immediately
    // In a real implementation, you'd schedule these
    const result = await payments.createTransfer(recipient, amount, { remark: recurringRemark });
    results.push(result);
  }
  
  return results;
}

/**
 * Send with conditional remark based on amount
 */
export async function sendWithConditionalRemark(
  payments: PaymentsClient,
  recipient: Address,
  amount: Coin,
  baseRemark: string,
  expiry?: Uint64
) {
  const amountValue = parseFloat(amount.amount);
  let conditionalRemark = baseRemark;
  
  if (amountValue > 1000000) {
    conditionalRemark += ' (Large transfer)';
  } else if (amountValue < 1000) {
    conditionalRemark += ' (Micro transfer)';
  }
  
  const options: any = { remark: conditionalRemark };
  if (expiry !== undefined) options.expiry = expiry;
  return await payments.createTransfer(recipient, amount, options);
}

/**
 * Convert and send (utility for different denominations)
 */
export async function convertAndSend(
  payments: PaymentsClient,
  recipient: Address,
  amount: string,
  fromDenom: string,
  toDenom: string,
  remark?: string
) {
  // Simple conversion logic (in real implementation, you'd use exchange rates)
  const coin = { amount, denom: toDenom };
  const options: any = {};
  if (remark) options.remark = remark;
  return await payments.createTransfer(recipient, coin, options);
}

/**
 * Send with currency conversion remark
 */
export async function sendWithConversion(
  payments: PaymentsClient,
  recipient: Address,
  amount: string,
  denom: string,
  originalAmount: string,
  originalDenom: string,
  remark?: string
) {
  const coin = { amount, denom };
  const conversionRemark = remark 
    ? `${remark} (Converted from ${originalAmount}${originalDenom})`
    : `Converted from ${originalAmount}${originalDenom}`;
  
  return await payments.createTransfer(recipient, coin, { remark: conversionRemark });
}