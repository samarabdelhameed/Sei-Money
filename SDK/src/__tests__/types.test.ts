/**
 * Tests for types module
 */

import { 
  Coin, 
  Address, 
  TxResult, 
  Transfer, 
  SeiMoneyError,
  NETWORKS,
  DEFAULT_CONFIG 
} from '../index';

describe('Types', () => {
  describe('Coin', () => {
    it('should create a valid coin', () => {
      const coin: Coin = {
        denom: 'usei',
        amount: '1000000'
      };
      
      expect(coin.denom).toBe('usei');
      expect(coin.amount).toBe('1000000');
    });
  });

  describe('Address', () => {
    it('should accept valid address format', () => {
      const address: Address = 'sei1abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890';
      
      expect(typeof address).toBe('string');
      expect(address.startsWith('sei')).toBe(true);
    });
  });

  describe('TxResult', () => {
    it('should create a valid transaction result', () => {
      const txResult: TxResult = {
        txHash: '0x1234567890abcdef',
        height: 12345,
        gasUsed: 100000,
        success: true
      };
      
      expect(txResult.txHash).toBe('0x1234567890abcdef');
      expect(txResult.height).toBe(12345);
      expect(txResult.gasUsed).toBe(100000);
      expect(txResult.success).toBe(true);
    });
  });

  describe('Transfer', () => {
    it('should create a valid transfer', () => {
      const transfer: Transfer = {
        id: 1,
        sender: 'sei1sender...',
        recipient: 'sei1recipient...',
        amount: { denom: 'usei', amount: '1000000' },
        remark: 'Test transfer',
        expiry_ts: 1234567890,
        claimed: false,
        refunded: false,
        created_at: 1234567890
      };
      
      expect(transfer.id).toBe(1);
      expect(transfer.sender).toBe('sei1sender...');
      expect(transfer.recipient).toBe('sei1recipient...');
      expect(transfer.amount.denom).toBe('usei');
      expect(transfer.amount.amount).toBe('1000000');
      expect(transfer.claimed).toBe(false);
      expect(transfer.refunded).toBe(false);
    });
  });

  describe('SeiMoneyError', () => {
    it('should create a custom error with code and details', () => {
      const error = new SeiMoneyError(
        'Test error message',
        'TEST_ERROR_CODE',
        { detail: 'test detail' }
      );
      
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('TEST_ERROR_CODE');
      expect(error.details).toEqual({ detail: 'test detail' });
      expect(error.name).toBe('SeiMoneyError');
    });
  });
});

describe('Configuration', () => {
  describe('NETWORKS', () => {
    it('should have testnet configuration', () => {
      expect(NETWORKS.TESTNET).toBeDefined();
      expect(NETWORKS.TESTNET.chainId).toBe('sei-testnet-1');
      expect(NETWORKS.TESTNET.rpcUrl).toBe('https://rpc.testnet.sei.io');
    });

    it('should have mainnet configuration', () => {
      expect(NETWORKS.MAINNET).toBeDefined();
      expect(NETWORKS.MAINNET.chainId).toBe('sei-1');
      expect(NETWORKS.MAINNET.rpcUrl).toBe('https://rpc.sei.io');
    });

    it('should have local configuration', () => {
      expect(NETWORKS.LOCAL).toBeDefined();
      expect(NETWORKS.LOCAL.chainId).toBe('sei-local');
      expect(NETWORKS.LOCAL.rpcUrl).toBe('http://localhost:26657');
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('should have default configuration', () => {
      expect(DEFAULT_CONFIG).toBeDefined();
      expect(DEFAULT_CONFIG.network).toBe(NETWORKS.TESTNET);
      expect(DEFAULT_CONFIG.contracts).toBeDefined();
      expect(DEFAULT_CONFIG.gasPrice).toBe('0.1usei');
      expect(DEFAULT_CONFIG.gasAdjustment).toBe(1.3);
    });
  });
});
