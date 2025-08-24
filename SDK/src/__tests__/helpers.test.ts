/**
 * Tests for helpers module
 */

import {
  sendSecure,
  sendBatch,
  scheduleTransfer,
  sendWithFee,
  splitTransfer,
  sendWithAutoExpiry,
  sendWithReminder,
  sendWithEscrow,
  sendWithRefundNotification,
  sendWithConditionalExpiry,
  sendSmart,
  sendConverted
} from '../helpers';
import { PaymentsClient } from '../clients/payments';
import { Coin } from '../types';

// Mock PaymentsClient
const mockPaymentsClient = {
  createTransfer: jest.fn(),
} as unknown as PaymentsClient;

describe('Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendSecure', () => {
    it('should call createTransfer with retry', async () => {
      const recipient = 'sei1recipient...';
      const amount: Coin = { denom: 'usei', amount: '1000000' };
      const remark = 'Test transfer';
      
      mockPaymentsClient.createTransfer = jest.fn().mockResolvedValue({
        txHash: '0x123',
        success: true,
        height: 12345,
        gasUsed: 100000,
      });

      const result = await sendSecure(mockPaymentsClient, recipient, amount, remark);
      
      expect(mockPaymentsClient.createTransfer).toHaveBeenCalledWith(
        recipient,
        amount,
        remark,
        undefined
      );
      expect(result.success).toBe(true);
    });
  });

  describe('sendBatch', () => {
    it('should send multiple transfers', async () => {
      const transfers = [
        { recipient: 'addr1', amount: { denom: 'usei', amount: '500000' } },
        { recipient: 'addr2', amount: { denom: 'usei', amount: '500000' } },
      ];

      mockPaymentsClient.createTransfer = jest.fn()
        .mockResolvedValueOnce({ success: true, txHash: '0x1' })
        .mockResolvedValueOnce({ success: true, txHash: '0x2' });

      const results = await sendBatch(mockPaymentsClient, transfers);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockPaymentsClient.createTransfer).toHaveBeenCalledTimes(2);
    });

    it('should handle failed transfers', async () => {
      const transfers = [
        { recipient: 'addr1', amount: { denom: 'usei', amount: '500000' } },
        { recipient: 'addr2', amount: { denom: 'usei', amount: '500000' } },
      ];

      mockPaymentsClient.createTransfer = jest.fn()
        .mockResolvedValueOnce({ success: true, txHash: '0x1' })
        .mockRejectedValueOnce(new Error('Failed'));

      const results = await sendBatch(mockPaymentsClient, transfers);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeDefined();
    });
  });

  describe('scheduleTransfer', () => {
    it('should create transfer with expiry', async () => {
      const recipient = 'sei1recipient...';
      const amount: Coin = { denom: 'usei', amount: '1000000' };
      const delaySeconds = 3600; // 1 hour
      
      mockPaymentsClient.createTransfer = jest.fn().mockResolvedValue({
        success: true,
        txHash: '0x123',
        height: 12345,
        gasUsed: 100000,
      });

      await scheduleTransfer(mockPaymentsClient, recipient, amount, delaySeconds);
      
      expect(mockPaymentsClient.createTransfer).toHaveBeenCalledWith(
        recipient,
        amount,
        undefined,
        expect.any(Number)
      );
      
      const callArgs = mockPaymentsClient.createTransfer.mock.calls[0];
      const expiry = callArgs[3];
      const now = Math.floor(Date.now() / 1000);
      
      expect(expiry).toBeGreaterThan(now);
      expect(expiry).toBeLessThanOrEqual(now + delaySeconds + 1); // Allow 1 second variance
    });
  });

  describe('sendWithFee', () => {
    it('should calculate and apply fee', async () => {
      const recipient = 'sei1recipient...';
      const amount: Coin = { denom: 'usei', amount: '1000000' };
      const feePercentage = 2.5;
      
      mockPaymentsClient.createTransfer = jest.fn().mockResolvedValue({
        success: true,
        txHash: '0x123',
        height: 12345,
        gasUsed: 100000,
      });

      await sendWithFee(mockPaymentsClient, recipient, amount, feePercentage);
      
      expect(mockPaymentsClient.createTransfer).toHaveBeenCalledWith(
        recipient,
        { denom: 'usei', amount: '975000' }, // 1000000 - 2.5% = 975000
        undefined,
        undefined
      );
    });

    it('should throw error for invalid fee percentage', async () => {
      const recipient = 'sei1recipient...';
      const amount: Coin = { denom: 'usei', amount: '1000000' };
      
      await expect(
        sendWithFee(mockPaymentsClient, recipient, amount, -5)
      ).rejects.toThrow('Fee percentage must be between 0 and 100');
      
      await expect(
        sendWithFee(mockPaymentsClient, recipient, amount, 150)
      ).rejects.toThrow('Fee percentage must be between 0 and 100');
    });
  });

  describe('splitTransfer', () => {
    it('should split amount among recipients', async () => {
      const recipients = ['addr1', 'addr2', 'addr3'];
      const totalAmount: Coin = { denom: 'usei', amount: '1000000' };
      
      mockPaymentsClient.createTransfer = jest.fn().mockResolvedValue({
        success: true,
        txHash: '0x123',
        height: 12345,
        gasUsed: 100000,
      });

      await splitTransfer(mockPaymentsClient, recipients, totalAmount);
      
      expect(mockPaymentsClient.createTransfer).toHaveBeenCalledTimes(3);
      
      // First recipient gets remainder
      expect(mockPaymentsClient.createTransfer).toHaveBeenNthCalledWith(
        1,
        'addr1',
        { denom: 'usei', amount: '333334' }, // 333333 + 1 (remainder)
        undefined,
        undefined
      );
      
      // Other recipients get equal amounts
      expect(mockPaymentsClient.createTransfer).toHaveBeenNthCalledWith(
        2,
        'addr2',
        { denom: 'usei', amount: '333333' },
        undefined,
        undefined
      );
      
      expect(mockPaymentsClient.createTransfer).toHaveBeenNthCalledWith(
        3,
        'addr3',
        { denom: 'usei', amount: '333333' },
        undefined,
        undefined
      );
    });

    it('should throw error for empty recipients', async () => {
      const totalAmount: Coin = { denom: 'usei', amount: '1000000' };
      
      await expect(
        splitTransfer(mockPaymentsClient, [], totalAmount)
      ).rejects.toThrow('At least one recipient is required');
    });
  });

  describe('sendWithAutoExpiry', () => {
    it('should set expiry based on amount', async () => {
      const recipient = 'sei1recipient...';
      const amount: Coin = { denom: 'usei', amount: '1000000' }; // 1M usei
      
      mockPaymentsClient.createTransfer = jest.fn().mockResolvedValue({
        success: true,
        txHash: '0x123',
        height: 12345,
        gasUsed: 100000,
      });

      await sendWithAutoExpiry(mockPaymentsClient, recipient, amount);
      
      expect(mockPaymentsClient.createTransfer).toHaveBeenCalledWith(
        recipient,
        amount,
        undefined,
        expect.any(Number)
      );
      
      const callArgs = mockPaymentsClient.createTransfer.mock.calls[0];
      const expiry = callArgs[3];
      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + (168 * 3600); // 1 week for 1M usei
      
      expect(expiry).toBeGreaterThan(now);
      expect(expiry).toBeLessThanOrEqual(expectedExpiry + 1); // Allow 1 second variance
    });
  });

  describe('sendWithReminder', () => {
    it('should set expiry with reminder', async () => {
      const recipient = 'sei1recipient...';
      const amount: Coin = { denom: 'usei', amount: '1000000' };
      const reminderDays = 7;
      
      mockPaymentsClient.createTransfer = jest.fn().mockResolvedValue({
        success: true,
        txHash: '0x123',
        height: 12345,
        gasUsed: 100000,
      });

      await sendWithReminder(mockPaymentsClient, recipient, amount, reminderDays);
      
      expect(mockPaymentsClient.createTransfer).toHaveBeenCalledWith(
        recipient,
        amount,
        'Transfer expires in 7 days',
        expect.any(Number)
      );
    });
  });

  describe('sendWithEscrow', () => {
    it('should set escrow expiry', async () => {
      const recipient = 'sei1recipient...';
      const amount: Coin = { denom: 'usei', amount: '1000000' };
      const escrowDays = 30;
      
      mockPaymentsClient.createTransfer = jest.fn().mockResolvedValue({
        success: true,
        txHash: '0x123',
        height: 12345,
        gasUsed: 100000,
      });

      await sendWithEscrow(mockPaymentsClient, recipient, amount, escrowDays);
      
      expect(mockPaymentsClient.createTransfer).toHaveBeenCalledWith(
        recipient,
        amount,
        'Escrow transfer for 30 days',
        expect.any(Number)
      );
    });
  });

  describe('sendWithRefundNotification', () => {
    it('should set refund expiry with notification', async () => {
      const recipient = 'sei1recipient...';
      const amount: Coin = { denom: 'usei', amount: '1000000' };
      const refundHours = 24;
      
      mockPaymentsClient.createTransfer = jest.fn().mockResolvedValue({
        success: true,
        txHash: '0x123',
        height: 12345,
        gasUsed: 100000,
      });

      await sendWithRefundNotification(mockPaymentsClient, recipient, amount, refundHours);
      
      expect(mockPaymentsClient.createTransfer).toHaveBeenCalledWith(
        recipient,
        amount,
        'Auto-refund in 24 hours if unclaimed',
        expect.any(Number)
      );
    });
  });

  describe('sendWithConditionalExpiry', () => {
    it('should set business hours expiry', async () => {
      const recipient = 'sei1recipient...';
      const amount: Coin = { denom: 'usei', amount: '1000000' };
      
      mockPaymentsClient.createTransfer = jest.fn().mockResolvedValue({
        success: true,
        txHash: '0x123',
        height: 12345,
        gasUsed: 100000,
      });

      await sendWithConditionalExpiry(
        mockPaymentsClient, 
        recipient, 
        amount, 
        'business_hours'
      );
      
      expect(mockPaymentsClient.createTransfer).toHaveBeenCalledWith(
        recipient,
        amount,
        'Conditional expiry: business_hours',
        expect.any(Number)
      );
    });
  });

  describe('sendSmart', () => {
    it('should parse string amount', async () => {
      const recipient = 'sei1recipient...';
      const amount = '1.5 usei';
      
      mockPaymentsClient.createTransfer = jest.fn().mockResolvedValue({
        success: true,
        txHash: '0x123',
        height: 12345,
        gasUsed: 100000,
      });

      await sendSmart(mockPaymentsClient, recipient, amount);
      
      expect(mockPaymentsClient.createTransfer).toHaveBeenCalledWith(
        recipient,
        { denom: 'usei', amount: '1500000' },
        undefined,
        undefined
      );
    });

    it('should handle coin object', async () => {
      const recipient = 'sei1recipient...';
      const amount: Coin = { denom: 'usei', amount: '1000000' };
      
      mockPaymentsClient.createTransfer = jest.fn().mockResolvedValue({
        success: true,
        txHash: '0x123',
        height: 12345,
        gasUsed: 100000,
      });

      await sendSmart(mockPaymentsClient, recipient, amount);
      
      expect(mockPaymentsClient.createTransfer).toHaveBeenCalledWith(
        recipient,
        amount,
        undefined,
        undefined
      );
    });
  });

  describe('sendConverted', () => {
    it('should convert between denominations', async () => {
      const recipient = 'sei1recipient...';
      const amount = 100;
      const fromDenom = 'usd';
      const toDenom = 'usei';
      const exchangeRate = 0.0001; // 1 USD = 0.0001 SEI
      
      mockPaymentsClient.createTransfer = jest.fn().mockResolvedValue({
        success: true,
        txHash: '0x123',
        height: 12345,
        gasUsed: 100000,
      });

      await sendConverted(
        mockPaymentsClient, 
        recipient, 
        amount, 
        fromDenom, 
        toDenom, 
        exchangeRate
      );
      
      expect(mockPaymentsClient.createTransfer).toHaveBeenCalledWith(
        recipient,
        { denom: 'usei', amount: '10' }, // 100 * 0.0001 = 0.01 SEI = 10 usei
        'Converted: 100 usd → 10 usei',
        undefined
      );
    });
  });
});
