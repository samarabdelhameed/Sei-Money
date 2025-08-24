import { PrismaClient } from '@prisma/client';

export class HeightTracker {
  constructor(_prisma: PrismaClient) {
    // TODO: Use prisma client for height tracking
  }

  async getLastIndexedHeight(): Promise<number> {
    // TODO: Implement height tracking
    // This would store/retrieve the last indexed block height
    return 0; // Start from genesis
  }

  async updateLastIndexedHeight(_height: number): Promise<void> {
    // TODO: Update the last indexed height
  }
}
