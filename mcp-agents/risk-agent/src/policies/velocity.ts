import type { PolicyResult } from "../types";

export async function velocity(ctx?: Record<string,unknown>): Promise<PolicyResult> {
  // TODO: read last hour/day tx count from indexer for 'from' address
  const txPerHour = Number((ctx?.["txPerHour"] as string) ?? "0");
  const txPerDay = Number((ctx?.["txPerDay"] as string) ?? "0");
  
  if (txPerHour > 400) return { score: 85, reason: "tx-burst" };
  if (txPerHour > 50)  return { score: 55, reason: "high-velocity" };
  if (txPerDay > 1000) return { score: 70, reason: "daily-limit-exceeded" };
  if (txPerDay > 100)  return { score: 30, reason: "active-user" };
  
  return { score: 10, reason: "low-velocity" };
}