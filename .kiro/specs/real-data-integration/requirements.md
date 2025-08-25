# Requirements Document - Real Data Integration for SeiMoney

## Introduction

This specification defines the requirements for implementing comprehensive real data integration across the SeiMoney DeFi platform. The goal is to connect all existing components (Smart Contracts, Backend API, Frontend UI, MCP Agents, and Bots) with live blockchain data and create seamless user experiences with real transaction flows.

Based on the current project structure, we have:
- ✅ 6 Smart Contracts deployed on Sei testnet (Payments, Groups, Pots, Vaults, Risk Escrow, Alias)
- ✅ Backend API Gateway with routes and SDK integration
- ✅ Frontend React application with UI components
- ✅ MCP Agents (Risk, Scheduler, Rebalancer)
- ✅ Telegram & Discord bots
- ✅ Database schema and infrastructure

## Requirements

### Requirement 1: Smart Contract Data Integration

**User Story:** As a user, I want the frontend to display real data from deployed smart contracts, so that I can see actual transaction history, balances, and contract states.

#### Acceptance Criteria

1. WHEN a user connects their wallet THEN the system SHALL query real contract data from Sei testnet using deployed contract addresses
2. WHEN displaying transfers THEN the system SHALL show actual on-chain transfer data from the Payments contract (sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg)
3. WHEN showing group pools THEN the system SHALL display real pool data from the Groups contract (sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt)
4. WHEN viewing savings pots THEN the system SHALL show actual pot data from the Pots contract (sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj)
5. WHEN accessing vaults THEN the system SHALL display real vault information from the Vaults contract (sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h)
6. WHEN checking escrow cases THEN the system SHALL show actual case data from the Risk Escrow contract (sei1q3gqr9ywvma6j6kja67n4h7fxz790x5lhj4v5phv2za0v7wsp5qqkrz0pj)
7. WHEN resolving usernames THEN the system SHALL query the Alias contract (sei1thjuavd70uq7txe79uj8pfy2vfyl3zvmenkyxh6ew4vag9mckq4qrtjav4) for real address mappings
8. WHEN contract queries fail THEN the system SHALL display appropriate error messages and fallback to cached data if available

### Requirement 2: Backend API Real Data Integration

**User Story:** As a developer, I want the backend API to serve real blockchain data instead of mock data, so that the frontend receives accurate information.

#### Acceptance Criteria

1. WHEN the API receives a request THEN it SHALL query the appropriate smart contract using the existing SeiMoneySDK
2. WHEN fetching market stats THEN the system SHALL calculate real TVL, user counts, and success rates from actual contract data and events
3. WHEN getting transfer history THEN the API SHALL return actual blockchain transaction data using listTransfersBySender/listTransfersByRecipient methods
4. WHEN retrieving vault performance THEN the system SHALL calculate real APY and returns from contract events and vault state
5. WHEN checking user balances THEN the API SHALL query the actual Sei network using CosmWasmClient.getBalance
6. WHEN processing transactions THEN the system SHALL use real signing clients to execute on-chain transactions
7. WHEN API endpoints timeout THEN the system SHALL implement proper retry logic with exponential backoff
8. WHEN contract addresses are misconfigured THEN the system SHALL validate addresses on startup and log errors

### Requirement 3: Frontend Real-Time Data Display

**User Story:** As a user, I want to see real-time updates of my transactions and portfolio, so that I have accurate information about my DeFi activities.

#### Acceptance Criteria

1. WHEN viewing the dashboard THEN the system SHALL display real portfolio values calculated from actual wallet balances and contract positions
2. WHEN a transaction is submitted THEN the UI SHALL show real transaction hashes from Sei network and track confirmation status
3. WHEN checking transfer status THEN the system SHALL display actual on-chain status (pending, claimed, refunded, expired) from contract state
4. WHEN viewing vault positions THEN the UI SHALL show real share balances and current values calculated from vault contract data
5. WHEN monitoring group pools THEN the system SHALL display actual contribution amounts and participant lists from Groups contract
6. WHEN tracking savings goals THEN the UI SHALL show real progress based on actual deposits stored in Pots contract
7. WHEN wallet is disconnected THEN the system SHALL clear all user-specific data and show appropriate empty states
8. WHEN network is slow THEN the system SHALL show loading states with estimated completion times

### Requirement 4: Wallet Integration and Transaction Flow

**User Story:** As a user, I want to connect my real Sei wallet and execute actual transactions, so that I can use the platform with real funds.

#### Acceptance Criteria

1. WHEN connecting a wallet THEN the system SHALL support Keplr and Leap wallet providers for Sei network (atlantic-2)
2. WHEN submitting a transaction THEN the system SHALL use the connected wallet to sign and broadcast to Sei network using proper gas estimation
3. WHEN a transaction is confirmed THEN the system SHALL update the UI with the actual transaction hash and link to SeiTrace explorer
4. WHEN checking balances THEN the system SHALL query the real wallet balance from Sei network using the configured RPC endpoint
5. WHEN transaction fails THEN the system SHALL display the actual error message from the blockchain with user-friendly explanations
6. WHEN transaction succeeds THEN the system SHALL emit real events that can be tracked by the backend indexer service
7. WHEN wallet is locked THEN the system SHALL prompt user to unlock wallet and retry the operation
8. WHEN insufficient balance THEN the system SHALL show exact balance needed and suggest funding options

### Requirement 5: MCP Agents Real Data Processing

**User Story:** As a system administrator, I want MCP agents to process real blockchain data and provide accurate risk assessment and optimization, so that users receive intelligent recommendations.

#### Acceptance Criteria

1. WHEN the Risk Agent evaluates a transaction THEN it SHALL analyze real address history and transaction patterns
2. WHEN the Scheduler Agent plans execution THEN it SHALL use real gas prices and network conditions
3. WHEN the Rebalancer Agent optimizes portfolios THEN it SHALL use real market data and vault performance
4. WHEN agents make recommendations THEN they SHALL base decisions on actual user transaction history
5. WHEN processing batch operations THEN agents SHALL handle real transaction volumes and network constraints

### Requirement 6: Bot Integration with Live Data

**User Story:** As a user, I want to interact with Telegram and Discord bots using real wallet data and execute actual transactions, so that I can manage my DeFi activities through messaging platforms.

#### Acceptance Criteria

1. WHEN binding a wallet to a bot THEN the system SHALL verify the actual Sei address format and existence
2. WHEN checking balance through bots THEN they SHALL return real wallet balances from the Sei network
3. WHEN creating transfers through bots THEN they SHALL execute actual on-chain transactions
4. WHEN claiming transfers THEN bots SHALL interact with real smart contracts to process claims
5. WHEN checking transaction status THEN bots SHALL query actual blockchain data for current status

### Requirement 7: Error Handling and Edge Cases

**User Story:** As a user, I want the system to handle real-world errors gracefully, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN network connectivity fails THEN the system SHALL display appropriate error messages and retry mechanisms
2. WHEN smart contract calls fail THEN the system SHALL show the actual contract error messages
3. WHEN insufficient balance occurs THEN the system SHALL display the exact balance and required amount
4. WHEN transactions are rejected THEN the system SHALL explain the rejection reason from the blockchain
5. WHEN contract addresses are invalid THEN the system SHALL validate and provide correction suggestions

### Requirement 8: Performance and Scalability

**User Story:** As a user, I want the system to load quickly and handle multiple concurrent operations, so that I have a smooth experience even during high usage.

#### Acceptance Criteria

1. WHEN loading dashboard data THEN the system SHALL cache frequently accessed contract data for up to 30 seconds
2. WHEN multiple users access the system THEN it SHALL handle concurrent blockchain queries efficiently
3. WHEN displaying large transaction lists THEN the system SHALL implement pagination with real data
4. WHEN network is slow THEN the system SHALL show loading states and estimated completion times
5. WHEN blockchain is congested THEN the system SHALL adjust gas prices and provide timing estimates

### Requirement 9: Data Consistency and Synchronization

**User Story:** As a user, I want all parts of the system to show consistent data, so that I don't see conflicting information across different interfaces.

#### Acceptance Criteria

1. WHEN data changes on-chain THEN all system components SHALL reflect the updated state within 60 seconds
2. WHEN viewing data across frontend, API, and bots THEN they SHALL show consistent information
3. WHEN transactions are processed THEN the indexer SHALL update the database with accurate event data
4. WHEN cache expires THEN the system SHALL refresh with the latest blockchain data
5. WHEN conflicts occur THEN the system SHALL prioritize on-chain data as the source of truth

### Requirement 10: Complete User Test Scenarios

**User Story:** As a user, I want to experience complete end-to-end workflows with real data, so that I can use the platform like a real DeFi application.

#### Acceptance Criteria

1. WHEN creating a transfer THEN the system SHALL execute real on-chain transactions and update UI with actual transaction status
2. WHEN claiming a transfer THEN the system SHALL interact with real Payments contract and show actual balance changes
3. WHEN creating a group pool THEN the system SHALL store real data in Groups contract and display actual participant information
4. WHEN contributing to a pool THEN the system SHALL execute real transactions and update pool progress with actual amounts
5. WHEN creating a savings pot THEN the system SHALL store real goal data in Pots contract and track actual deposits
6. WHEN depositing to a vault THEN the system SHALL execute real vault transactions and show actual share calculations
7. WHEN viewing dashboard THEN the system SHALL display real portfolio values calculated from actual contract positions
8. WHEN checking transaction history THEN the system SHALL show real on-chain transaction data with actual timestamps and amounts
9. WHEN wallet balance changes THEN the system SHALL reflect actual balance updates from Sei network
10. WHEN network errors occur THEN the system SHALL handle real blockchain errors gracefully with proper user feedback

### Requirement 11: End-to-End Data Flow Integration

**User Story:** As a system administrator, I want all components to work together with real data, so that the platform operates as a complete DeFi ecosystem.

#### Acceptance Criteria

1. WHEN backend API receives requests THEN it SHALL query real smart contracts instead of returning mock data
2. WHEN frontend loads data THEN it SHALL display actual contract state and user positions
3. WHEN MCP agents analyze data THEN they SHALL process real transaction patterns and contract events
4. WHEN bots execute operations THEN they SHALL interact with real contracts and actual user wallets
5. WHEN indexer processes events THEN it SHALL store real blockchain events in the database
6. WHEN notifications are sent THEN they SHALL be triggered by real contract events and transaction confirmations
7. WHEN market data is calculated THEN it SHALL be based on actual TVL and transaction volumes from contracts
8. WHEN user performs any action THEN the entire system SHALL respond with real data throughout the complete workflow