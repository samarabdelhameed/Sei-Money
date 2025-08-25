# SeiMoney API Documentation - Real Data Integration

## Base URL
```
Production: https://api.seimoney.com/api/v1
Development: http://localhost:3001/api/v1
```

## Authentication
All endpoints that modify data require wallet authentication via signed messages.

```http
Authorization: Bearer <wallet_signature>
X-Wallet-Address: <sei_address>
```

## Health Check

### GET /health
Check overall system health and contract connectivity.

**Response:**
```json
{
  "ok": true,
  "services": {
    "database": "healthy",
    "redis": "healthy", 
    "blockchain": "healthy"
  },
  "contracts": {
    "payments": "healthy",
    "groups": "healthy",
    "pots": "healthy",
    "vaults": "healthy",
    "escrow": "healthy",
    "alias": "healthy"
  },
  "rpcHealth": {
    "healthy": 3,
    "total": 3
  },
  "timestamp": "2025-08-25T04:00:00Z"
}
```

## Transfers API

### GET /transfers
List transfers with real contract data.

**Query Parameters:**
- `sender` (string, optional): Filter by sender address
- `recipient` (string, optional): Filter by recipient address  
- `status` (string, optional): Filter by status (pending, claimed, refunded, expired)
- `limit` (number, optional): Number of results (default: 20, max: 100)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "ok": true,
  "data": {
    "transfers": [
      {
        "id": 1,
        "sender": "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azq",
        "recipient": "sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2s",
        "amount": "1000000",
        "denom": "usei",
        "amountFormatted": "1.00 SEI",
        "status": "pending",
        "remark": "Payment for services",
        "created_at": "2025-08-25T04:00:00Z",
        "expires_at": "2025-08-26T04:00:00Z",
        "txHash": "0x123456789abcdef...",
        "blockHeight": 12345
      }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1,
    "lastUpdated": "2025-08-25T04:00:00Z"
  }
}
```

### GET /transfers/:id
Get specific transfer details.

**Response:**
```json
{
  "ok": true,
  "data": {
    "transfer": {
      "id": 1,
      "sender": "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azq",
      "recipient": "sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2s",
      "amount": "1000000",
      "denom": "usei",
      "amountFormatted": "1.00 SEI",
      "status": "pending",
      "remark": "Payment for services",
      "created_at": "2025-08-25T04:00:00Z",
      "expires_at": "2025-08-26T04:00:00Z",
      "txHash": "0x123456789abcdef...",
      "blockHeight": 12345,
      "retrievedAt": "2025-08-25T04:00:00Z"
    }
  }
}
```

### POST /transfers
Create a new transfer with real blockchain transaction.

**Request Body:**
```json
{
  "recipient": "sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2s",
  "amount": "1000000",
  "remark": "Payment for services",
  "expiry_hours": 24
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "transferId": 1,
    "txHash": "0x123456789abcdef...",
    "blockHeight": 12345,
    "gasUsed": 180000,
    "sender": "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azq",
    "recipient": "sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2s",
    "amount": "1000000",
    "status": "pending",
    "createdAt": "2025-08-25T04:00:00Z",
    "expiresAt": "2025-08-26T04:00:00Z"
  }
}
```

### POST /transfers/:id/claim
Claim a transfer with real blockchain transaction.

**Response:**
```json
{
  "ok": true,
  "data": {
    "transferId": 1,
    "txHash": "0x987654321fedcba...",
    "blockHeight": 12346,
    "gasUsed": 140000,
    "claimer": "sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2s",
    "amount": "1000000",
    "claimedAt": "2025-08-25T04:30:00Z"
  }
}
```

## Vaults API

### GET /vaults
List vaults with real TVL and APY data.

**Query Parameters:**
- `strategy` (string, optional): Filter by strategy
- `limit` (number, optional): Number of results (default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "ok": true,
  "data": {
    "vaults": [
      {
        "id": "vault_1",
        "label": "SEI Yield Vault",
        "strategy": "yield_farming",
        "tvl": "5000000000",
        "tvlFormatted": "5,000.00 SEI",
        "apr": 12.5,
        "aprFormatted": "12.50%",
        "total_shares": "1000000",
        "min_deposit": "1000000",
        "max_deposit": "100000000000",
        "fee_bps": 200,
        "creator": "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azq",
        "status": "active",
        "created_at": "2025-08-20T00:00:00Z",
        "performance": {
          "daily_return": 0.034,
          "weekly_return": 0.24,
          "monthly_return": 1.04,
          "total_return": 12.5
        },
        "lastUpdated": "2025-08-25T04:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1,
    "strategy": null,
    "lastUpdated": "2025-08-25T04:00:00Z"
  }
}
```

### GET /vaults/:id
Get specific vault with enhanced performance data.

**Response:**
```json
{
  "ok": true,
  "data": {
    "vault": {
      "id": "vault_1",
      "label": "SEI Yield Vault",
      "strategy": "yield_farming",
      "tvl": "5000000000",
      "tvlFormatted": "5,000.00 SEI",
      "apr": 12.5,
      "aprFormatted": "12.50%",
      "total_shares": "1000000",
      "min_deposit": "1000000",
      "max_deposit": "100000000000",
      "fee_bps": 200,
      "creator": "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azq",
      "status": "active",
      "created_at": "2025-08-20T00:00:00Z",
      "performance": {
        "daily_return": 0.034,
        "weekly_return": 0.24,
        "monthly_return": 1.04,
        "total_return": 12.5,
        "sharpe_ratio": 1.8,
        "max_drawdown": -2.1,
        "volatility": 8.3
      },
      "retrievedAt": "2025-08-25T04:00:00Z"
    }
  }
}
```

### POST /vaults/:id/deposit
Deposit to vault with real transaction execution.

**Request Body:**
```json
{
  "amount": "1000000"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "vaultId": "vault_1",
    "txHash": "0x456789abcdef123...",
    "blockHeight": 12347,
    "gasUsed": 140000,
    "depositor": "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azq",
    "amount": "1000000",
    "sharesReceived": "950",
    "depositedAt": "2025-08-25T04:00:00Z"
  }
}
```

### GET /vaults/:id/position
Get user position in vault with real calculations.

**Query Parameters:**
- `addr` (string, optional): Address to check (defaults to authenticated user)

**Response:**
```json
{
  "ok": true,
  "data": {
    "position": {
      "vaultId": "vault_1",
      "address": "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azq",
      "shares": "950",
      "sharesFormatted": "950",
      "percentage": "0.0950",
      "value": "1000000",
      "shareValue": 1.0,
      "shareValueFormatted": "1.00 SEI",
      "vault": {
        "label": "SEI Yield Vault",
        "strategy": "yield_farming",
        "tvl": "5000000000",
        "apr": 12.5
      },
      "retrievedAt": "2025-08-25T04:00:00Z"
    }
  }
}
```

## Groups API

### GET /groups
List group pools with real participant data.

**Response:**
```json
{
  "ok": true,
  "data": {
    "groups": [
      {
        "id": "group_1",
        "name": "Vacation Fund",
        "description": "Saving for team vacation",
        "target_amount": "10000000000",
        "current_amount": "7500000000",
        "targetFormatted": "10,000.00 SEI",
        "currentFormatted": "7,500.00 SEI",
        "progress": 75.0,
        "participants": [
          {
            "address": "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azq",
            "contributed": "2500000000",
            "contributedFormatted": "2,500.00 SEI",
            "percentage": 33.33
          },
          {
            "address": "sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2s",
            "contributed": "5000000000",
            "contributedFormatted": "5,000.00 SEI",
            "percentage": 66.67
          }
        ],
        "creator": "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azq",
        "status": "active",
        "created_at": "2025-08-20T00:00:00Z",
        "deadline": "2025-12-31T23:59:59Z"
      }
    ],
    "total": 1,
    "lastUpdated": "2025-08-25T04:00:00Z"
  }
}
```

### POST /groups/:id/contribute
Contribute to group pool with real transaction.

**Request Body:**
```json
{
  "amount": "1000000"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "groupId": "group_1",
    "txHash": "0x789abcdef123456...",
    "blockHeight": 12348,
    "gasUsed": 160000,
    "contributor": "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azq",
    "amount": "1000000",
    "newTotal": "8500000000",
    "newProgress": 85.0,
    "contributedAt": "2025-08-25T04:00:00Z"
  }
}
```

## Pots API

### GET /pots
List savings pots with real progress tracking.

**Query Parameters:**
- `owner` (string, optional): Filter by owner address

**Response:**
```json
{
  "ok": true,
  "data": {
    "pots": [
      {
        "id": 1,
        "owner": "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azq",
        "label": "Emergency Fund",
        "description": "Saving for emergencies",
        "target_amount": "5000000000",
        "current_amount": "3000000000",
        "targetFormatted": "5,000.00 SEI",
        "currentFormatted": "3,000.00 SEI",
        "progress": 60.0,
        "status": "active",
        "created_at": "2025-08-20T00:00:00Z",
        "target_date": "2025-12-31T23:59:59Z",
        "deposits": [
          {
            "amount": "1000000000",
            "amountFormatted": "1,000.00 SEI",
            "deposited_at": "2025-08-20T00:00:00Z",
            "txHash": "0xabc123..."
          }
        ]
      }
    ],
    "total": 1,
    "lastUpdated": "2025-08-25T04:00:00Z"
  }
}
```

### POST /pots/:id/deposit
Deposit to savings pot with real transaction.

**Request Body:**
```json
{
  "amount": "1000000"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "potId": 1,
    "txHash": "0xdef456789abc...",
    "blockHeight": 12349,
    "gasUsed": 150000,
    "depositor": "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azq",
    "amount": "1000000",
    "newTotal": "4000000000",
    "newProgress": 80.0,
    "depositedAt": "2025-08-25T04:00:00Z"
  }
}
```

## Wallet API

### GET /wallet/balance
Get real wallet balance from blockchain.

**Query Parameters:**
- `address` (string): Wallet address to check

**Response:**
```json
{
  "ok": true,
  "data": {
    "address": "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azq",
    "balances": [
      {
        "denom": "usei",
        "amount": "5000000000",
        "formatted": "5,000.00 SEI"
      }
    ],
    "totalValue": 5000.0,
    "lastUpdated": "2025-08-25T04:00:00Z"
  }
}
```

### POST /wallet/validate
Validate wallet address format.

**Request Body:**
```json
{
  "address": "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azq"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "valid": true,
    "address": "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azq",
    "network": "sei",
    "type": "bech32"
  }
}
```

## Market Data API

### GET /market/stats
Get real market statistics calculated from contract data.

**Response:**
```json
{
  "ok": true,
  "data": {
    "totalTvl": 25000000000,
    "totalTvlFormatted": "25,000.00 SEI",
    "activeUsers": 1250,
    "totalTransactions": 5680,
    "successRate": 98.5,
    "avgApy": 11.8,
    "topVaults": [
      {
        "id": "vault_1",
        "label": "SEI Yield Vault",
        "tvl": "5000000000",
        "apr": 12.5
      }
    ],
    "recentActivity": [
      {
        "type": "deposit",
        "amount": "1000000",
        "txHash": "0x123...",
        "timestamp": "2025-08-25T04:00:00Z"
      }
    ],
    "timestamp": "2025-08-25T04:00:00Z"
  }
}
```

## Real-time Updates

### WebSocket Connection
Connect to real-time updates for contract events.

```javascript
const ws = new WebSocket('ws://localhost:3001/realtime');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

**Event Types:**
- `transfer_created`: New transfer created
- `transfer_claimed`: Transfer claimed
- `vault_deposit`: Vault deposit made
- `vault_withdrawal`: Vault withdrawal made
- `group_contribution`: Group contribution made
- `pot_deposit`: Pot deposit made

**Event Format:**
```json
{
  "type": "transfer_created",
  "data": {
    "transferId": 1,
    "sender": "sei1abc...",
    "recipient": "sei1def...",
    "amount": "1000000",
    "txHash": "0x123...",
    "timestamp": "2025-08-25T04:00:00Z"
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "ok": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details",
  "suggestedAction": "What the user should do",
  "timestamp": "2025-08-25T04:00:00Z"
}
```

### Common Error Codes

- `INSUFFICIENT_FUNDS`: Not enough balance for transaction
- `TRANSFER_NOT_FOUND`: Transfer ID does not exist
- `TRANSFER_EXPIRED`: Transfer has expired
- `UNAUTHORIZED`: Authentication required or invalid
- `INVALID_ADDRESS`: Wallet address format invalid
- `NETWORK_ERROR`: Blockchain network connectivity issue
- `CONTRACT_ERROR`: Smart contract execution failed
- `TIMEOUT`: Request timed out
- `RATE_LIMITED`: Too many requests

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **General endpoints**: 100 requests per minute per IP
- **Write operations**: 10 requests per minute per wallet
- **Market data**: 60 requests per minute per IP

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## SDK Usage Examples

### JavaScript/TypeScript
```typescript
import { SeiMoneyAPI } from '@seimoney/sdk';

const api = new SeiMoneyAPI({
  baseURL: 'http://localhost:3001/api/v1',
  walletAddress: 'sei1abc...'
});

// Get transfers
const transfers = await api.transfers.list();

// Create transfer
const transfer = await api.transfers.create({
  recipient: 'sei1def...',
  amount: '1000000',
  remark: 'Payment'
});

// Get vault data
const vaults = await api.vaults.list();

// Deposit to vault
const deposit = await api.vaults.deposit('vault_1', {
  amount: '1000000'
});
```

This API documentation provides comprehensive examples of real data integration with actual blockchain responses and error handling.