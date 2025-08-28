import { describe, it, expect, vi, beforeEach } from 'vitest';
import { escrowContractService, CreateEscrowParams } from '../escrow-contract';
import { contractService } from '../contract-service';

// Mock the contract service
vi.mock('../contract-service', () => ({
  contractService: {
    call: vi.fn()
  }
}));

describe('EscrowContractService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEscrow', () => {
    it('should create an escrow successfully', async () => {
      const mockTxHash = '0x123456789abcdef';
      const mockContractResponse = {
        success: true,
        data: {
          transactionHash: mockTxHash,
          result: 'success'
        },
        timestamp: Date.now()
      };

      vi.mocked(contractService.call).mockResolvedValue(mockContractResponse);

      const createParams: CreateEscrowParams = {
        title: 'Test Escrow',
        description: 'Test escrow description',
        amount: 100,
        seller: 'sei1seller123',
        arbiter: 'sei1arbiter123',
        expiryDate: new Date('2024-12-31'),
        terms: ['Term 1', 'Term 2']
      };

      const result = await escrowContractService.createEscrow(createParams);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe('Test Escrow');
      expect(result.data?.amount).toBe(100);
      expect(result.data?.status).toBe('created');
      
      expect(contractService.call).toHaveBeenCalledWith({
        contractAddress: expect.any(String),
        method: 'create_escrow',
        args: [expect.objectContaining({
          title: 'Test Escrow',
          description: 'Test escrow description',
          amount: '100000000', // Converted to usei
          seller: 'sei1seller123',
          arbiter: 'sei1arbiter123'
        })],
        value: 0
      });
    });

    it('should handle escrow creation failure', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Contract execution failed',
        timestamp: Date.now()
      };

      vi.mocked(contractService.call).mockResolvedValue(mockErrorResponse);

      const createParams: CreateEscrowParams = {
        title: 'Test Escrow',
        description: 'Test escrow description',
        amount: 100,
        seller: 'sei1seller123',
        arbiter: 'sei1arbiter123',
        expiryDate: new Date('2024-12-31'),
        terms: []
      };

      const result = await escrowContractService.createEscrow(createParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Contract execution failed');
    });
  });

  describe('fundEscrow', () => {
    it('should fund an escrow successfully', async () => {
      const mockTxHash = '0x987654321fedcba';
      const mockContractResponse = {
        success: true,
        data: {
          transactionHash: mockTxHash
        },
        timestamp: Date.now()
      };

      vi.mocked(contractService.call).mockResolvedValue(mockContractResponse);

      const result = await escrowContractService.fundEscrow('escrow123', 50);

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockTxHash);
      
      expect(contractService.call).toHaveBeenCalledWith({
        contractAddress: expect.any(String),
        method: 'fund_escrow',
        args: [{
          escrow_id: 'escrow123',
          amount: '50000000' // Converted to usei
        }],
        value: 50000000
      });
    });
  });

  describe('getUserEscrows', () => {
    it('should get user escrows successfully', async () => {
      const mockContractResponse = {
        success: true,
        data: {
          result: [
            {
              id: 'escrow1',
              title: 'Test Escrow 1',
              description: 'Description 1',
              amount: '100000000',
              buyer: 'sei1buyer123',
              seller: 'sei1seller123',
              arbiter: 'sei1arbiter123',
              status: 'created',
              created_at: Math.floor(Date.now() / 1000),
              expiry: Math.floor(new Date('2024-12-31').getTime() / 1000),
              terms: ['Term 1'],
              milestones: []
            }
          ]
        },
        timestamp: Date.now()
      };

      vi.mocked(contractService.call).mockResolvedValue(mockContractResponse);

      const result = await escrowContractService.getUserEscrows('sei1user123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].title).toBe('Test Escrow 1');
      expect(result.data?.[0].amount).toBe(100); // Converted from usei
      expect(result.data?.[0].status).toBe('created');
    });

    it('should handle empty escrow list', async () => {
      const mockContractResponse = {
        success: true,
        data: {
          result: []
        },
        timestamp: Date.now()
      };

      vi.mocked(contractService.call).mockResolvedValue(mockContractResponse);

      const result = await escrowContractService.getUserEscrows('sei1user123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('raiseDispute', () => {
    it('should raise a dispute successfully', async () => {
      const mockTxHash = '0xdispute123';
      const mockContractResponse = {
        success: true,
        data: {
          transactionHash: mockTxHash
        },
        timestamp: Date.now()
      };

      vi.mocked(contractService.call).mockResolvedValue(mockContractResponse);

      const result = await escrowContractService.raiseDispute(
        'escrow123', 
        'Seller not delivering', 
        ['evidence1', 'evidence2']
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.reason).toBe('Seller not delivering');
      expect(result.data?.evidence).toEqual(['evidence1', 'evidence2']);
      expect(result.data?.status).toBe('open');
      
      expect(contractService.call).toHaveBeenCalledWith({
        contractAddress: expect.any(String),
        method: 'raise_dispute',
        args: [{
          escrow_id: 'escrow123',
          reason: 'Seller not delivering',
          evidence: ['evidence1', 'evidence2']
        }],
        value: 0
      });
    });
  });
});