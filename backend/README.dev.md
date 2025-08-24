# 🛠️ **SeiMoney 🐒💰 – Production-Grade Backend Prompt (Smart Contract Integrated)**

You are building a complete **production-grade backend** for a modular DeFi dApp called **SeiMoney 🐒💰**, deployed on the **Sei Network** using **CosmWasm smart contracts**.

## 🎯 Goal:
Implement a full backend system that integrates tightly with SeiMoney's deployed smart contracts. This includes real-time indexing of blockchain events, execution of on-chain transactions, scheduling of time-based jobs, and multi-channel notifications — all via TypeScript.

---

## 📂 Folder Structure:
```
backend/
├─ services/
│  ├─ api-gateway/       # REST API (Fastify)
│  ├─ indexer/           # Blockchain event listener (WebSocket)
│  ├─ scheduler/         # BullMQ jobs: harvests, refunds, expiries
│  ├─ notifier/          # Telegram/WebPush/Email templates
│  └─ oracles/           # Prices, APRs, cached adapters
├─ prisma/schema.prisma  # DB models for transfers, vaults, etc.
├─ .env                  # Contract addresses, RPC, Redis, DB...
└─ README.md
```

---

## ✅ Integration Points:

### 🔗 SDK Integration (Smart Contracts)
- Use internal `lib/sdk.ts` to build SDK clients using `sdk/src/clients/*.ts`
- Contracts covered: `payments`, `groups`, `pots`, `escrow`, `vaults`
- All on-chain interaction must go through the SDK:
```ts
const { payments, vaults } = await getSdk(req);
await payments.createTransfer(...);
await vaults.rebalance(...);
```

### 🧩 Contracts are passed via `.env`:
```
CHAIN_ID=sei-testnet-1
RPC_URL=https://rpc.testnet.sei.io
REST_URL=https://rest.testnet.sei.io
DENOM=usei
CONTRACT_PAYMENTS=sei1...
CONTRACT_GROUPS=sei1...
CONTRACT_VAULTS=sei1...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
INTERNAL_SHARED_SECRET=...
TELEGRAM_BOT_TOKEN=...
```

---

## 🚪 REST API Gateway (Fastify)

* Modular routes: `/transfers`, `/groups`, `/pots`, `/vaults`, `/escrow`
* POST requests trigger transactions via SDK
* Middleware:
  * `auth.ts` – JWT or internal keys
  * `rateLimit.ts` – per-user throttling
  * `idempotency.ts` – deduplication for critical ops
* Schema validation via Zod
* Consistent API response: `{ ok: true, data }`
* Contracts are accessed through SDK clients

---

## 🔎 Blockchain Event Indexer

* Subscribes to Tendermint via WebSocket: `tm.event='Tx'`
* Parses `wasm` events like:
  * `create_transfer`, `claim_transfer`, `refund_transfer`
  * `create_vault`, `harvest_vault`, `rebalance_vault`
* Upserts into Postgres: `TransferMeta`, `VaultMeta`, `EventLog`
* Saves last indexed height for recovery
* Triggers downstream services (jobs, notifications)

---

## ⏱️ Scheduler (BullMQ)

* Queue system using Redis
* Jobs:
  * `expiredTransfers.ts` → auto-refund on expiry
  * `vaultHarvests.ts` → scheduled APY harvests
  * `rebalanceVaults.ts` → run AI-generated plans
  * `escrowExpiries.ts` → resolve or refund expired cases
* Jobs use SDK → directly call smart contracts
* Job keys = idempotency keys
* Concurrency and retry policies
* Metrics tracked via Prometheus (optional)

---

## 🔔 Notifier

* Channels supported:
  * Telegram (Bot API)
  * Email (SMTP / SES)
  * WebPush (VAPID)
* Templates like:
  * `TRANSFER_CREATED`, `VAULT_REBALANCED`, `ESCROW_DISPUTED`
* Payload structure:
```json
{
  "user": "sei1.../username",
  "event": "TRANSFER_CREATED",
  "data": { "transferId": 42, "amount": "1000usei" },
  "cta": "https://app.seimoney.xyz/transfers/42"
}
```
* Delivery logs stored in DB

---

## 📈 Oracles

* Adapters to fetch:
  * Token prices (via Rivalz or fallback)
  * APR per strategy: Staking, Lending, LP
* `getPrice(denom)` → number
* `getApr(proto)` → number
* In-memory + Redis caching
* TTL + Circuit breakers for reliability

---

## 🗄️ Database Schema (Prisma/PostgreSQL)

* `User`, `TransferMeta`, `VaultMeta`, `EscrowCase`, `EventLog`, `Notification`
* Designed for fast lookup by address or ID
* Tracks full contract event history

---

## ✅ Dev Ready

* Internal `.env` shared by all services
* Shared SDK/Prisma/logger modules
* `pnpm` monorepo or `yarn workspaces` friendly
* Crons can trigger job enqueuing
* REST endpoints and job runners independently deployable

---

## 🎯 Final Goal:

Deliver a full backend that:

* 🧠 Integrates with CosmWasm smart contracts via SDK
* 🧾 Indexes on-chain events in real-time
* ⏱️ Automates financial workflows via scheduled jobs
* 🔔 Notifies users across channels
* 📊 Feeds AI agents with accurate real-time vault data

📌 Result = **Autonomous, scalable, AI-ready backend for SeiMoney on Sei Network**
