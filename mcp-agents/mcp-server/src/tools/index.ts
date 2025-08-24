import { watchWallet } from "./watchWallet";
import { trackMemeCoin } from "./trackMemeCoin";
import { trackNftLifetime } from "./trackNftLifetime";
import { rebalanceWhatIf } from "./rebalanceWhatIf";

export const tools = {
  watchWallet,
  trackMemeCoin,
  trackNftLifetime,
  rebalanceWhatIf,
};

export type ToolName = keyof typeof tools;

// Tool metadata for validation and documentation
export const toolMetadata = {
  watchWallet: {
    description: "Monitor wallet activity and set up alerts",
    requiredParams: ["address"],
    optionalParams: ["alertThreshold"]
  },
  trackMemeCoin: {
    description: "Track meme coin flows and holder statistics",
    requiredParams: ["denom"],
    optionalParams: ["timeframe"]
  },
  trackNftLifetime: {
    description: "Track NFT collection lifecycle analytics",
    requiredParams: ["collection"],
    optionalParams: ["includeMetadata"]
  },
  rebalanceWhatIf: {
    description: "Simulate portfolio rebalancing scenarios",
    requiredParams: ["signals"],
    optionalParams: ["model"]
  }
};