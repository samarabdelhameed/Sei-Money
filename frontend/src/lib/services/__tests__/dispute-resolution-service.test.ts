import { describe, it, expect, vi, beforeEach } from 'vitest';
import { disputeResolutionService } from '../dispute-resolution-service';
import { contractService } from '../contract-service';

// Mock the contract service
vi.mock('../contract-service', () => ({
  contractService: {
    call: vi.fn()
  }
}));

describe('DisputeResolutionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitEvidence', () => {
    it('should submit evidence successfully', async () => {
      const mockTxHash = '0xevidence123';
      const mockContractResponse = {
        success: true,
        data: {
          transactionHash: mockTxHash
        },
        timestamp: Date.now()
      };

      vi.mocked(contractService.call).mockResolvedValue(mockContractResponse);

      const evidence = {
        submittedBy: 'sei1user123',
        type: 'document' as const,
        title: 'Contract Agreement',
        description: 'Original signed contract',
        content: 'document_content_here'
      };

      const result = await disputeResolutionService.submitEvidence('dispute123', evidence);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe('Contract Agreement');
      expect(result.data?.type).toBe('document');
      expect(result.data?.verified).toBe(false);
      
      expect(contractService.call).toHaveBeenCalledWith({
        contractAddress: expect.any(String),
        method: 'submit_evidence',
        args: [expect.objectContaining({
          dispute_id: 'dispute123',
          evidence_type: 'document',
          title: 'Contract Agreement',
          description: 'Original signed contract'
        })],
        value: 0
      });
    });
  });

  describe('createArbitrationCase', () => {
    it('should create arbitration case successfully', async () => {
      const mockTxHash = '0xarbitration123';
      const mockContractResponse = {
        success: true,
        data: {
          transactionHash: mockTxHash
        },
        timestamp: Date.now()
      };

      vi.mocked(contractService.call).mockResolvedValue(mockContractResponse);

      const arbiters = ['sei1arbiter1', 'sei1arbiter2', 'sei1arbiter3'];
      const result = await disputeResolutionService.createArbitrationCase('dispute123', arbiters);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.arbiters).toEqual(arbiters);
      expect(result.data?.requiredVotes).toBe(2); // Majority of 3
      expect(result.data?.status).toBe('voting');
      
      expect(contractService.call).toHaveBeenCalledWith({
        contractAddress: expect.any(String),
        method: 'create_arbitration_case',
        args: [expect.objectContaining({
          dispute_id: 'dispute123',
          arbiters,
          required_votes: 2
        })],
        value: 0
      });
    });
  });

  describe('submitArbitrationVote', () => {
    it('should submit arbitration vote successfully', async () => {
      const mockTxHash = '0xvote123';
      const mockContractResponse = {
        success: true,
        data: {
          transactionHash: mockTxHash
        },
        timestamp: Date.now()
      };

      vi.mocked(contractService.call).mockResolvedValue(mockContractResponse);

      const result = await disputeResolutionService.submitArbitrationVote(
        'case123',
        'buyer',
        'Evidence supports buyer claim',
        8
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.decision).toBe('buyer');
      expect(result.data?.reasoning).toBe('Evidence supports buyer claim');
      expect(result.data?.confidence).toBe(8);
      
      expect(contractService.call).toHaveBeenCalledWith({
        contractAddress: expect.any(String),
        method: 'submit_arbitration_vote',
        args: [{
          case_id: 'case123',
          decision: 'buyer',
          reasoning: 'Evidence supports buyer claim',
          confidence: 8
        }],
        value: 0
      });
    });

    it('should clamp confidence values to 1-10 range', async () => {
      const mockContractResponse = {
        success: true,
        data: { transactionHash: '0xvote123' },
        timestamp: Date.now()
      };

      vi.mocked(contractService.call).mockResolvedValue(mockContractResponse);

      // Test confidence > 10
      await disputeResolutionService.submitArbitrationVote('case123', 'buyer', 'reason', 15);
      expect(vi.mocked(contractService.call)).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [expect.objectContaining({ confidence: 10 })]
        })
      );

      // Test confidence < 1
      await disputeResolutionService.submitArbitrationVote('case123', 'seller', 'reason', -5);
      expect(vi.mocked(contractService.call)).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [expect.objectContaining({ confidence: 1 })]
        })
      );
    });
  });

  describe('getDisputeEvidence', () => {
    it('should get dispute evidence successfully', async () => {
      const mockContractResponse = {
        success: true,
        data: {
          result: [
            {
              id: 'evidence1',
              submitted_by: 'sei1user123',
              evidence_type: 'document',
              title: 'Contract',
              description: 'Original contract',
              content_hash: 'ipfs_hash_123',
              timestamp: Math.floor(Date.now() / 1000),
              verified: true
            }
          ]
        },
        timestamp: Date.now()
      };

      vi.mocked(contractService.call).mockResolvedValue(mockContractResponse);

      const result = await disputeResolutionService.getDisputeEvidence('dispute123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].title).toBe('Contract');
      expect(result.data?.[0].type).toBe('document');
      expect(result.data?.[0].verified).toBe(true);
    });

    it('should handle empty evidence list', async () => {
      const mockContractResponse = {
        success: true,
        data: { result: [] },
        timestamp: Date.now()
      };

      vi.mocked(contractService.call).mockResolvedValue(mockContractResponse);

      const result = await disputeResolutionService.getDisputeEvidence('dispute123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('executeAutoResolution', () => {
    it('should execute auto resolution successfully', async () => {
      const mockTxHash = '0xautoresolution123';
      const mockContractResponse = {
        success: true,
        data: {
          transactionHash: mockTxHash
        },
        timestamp: Date.now()
      };

      vi.mocked(contractService.call).mockResolvedValue(mockContractResponse);

      const result = await disputeResolutionService.executeAutoResolution('dispute123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.resolution).toBe('buyer_wins');
      expect(result.data?.reasoning).toContain('Automatic resolution');
      expect(result.data?.fundDistribution.buyer).toBe(0.95);
      expect(result.data?.fundDistribution.seller).toBe(0);
      expect(result.data?.fundDistribution.arbiters).toBe(0.05);
    });
  });
});