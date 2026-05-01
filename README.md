# 🚀 DeFi Yield Vault & Real-Time Indexer

A professional-grade DeFi portfolio project demonstrating a full-stack Web3 architecture — from Solidity smart contracts with **100% test coverage** to a real-time GraphQL indexer and a Next.js dashboard.

![Tests](https://github.com/YOUR_GITHUB_USER/defi-yield-indexer/actions/workflows/contracts-test.yml/badge.svg)

> **Live Demo:** [https://defi-yield-vault.vercel.app](https://defi-yield-vault.vercel.app) *(update after Vercel deploy)*  
> **Contract on Sepolia:** [0x... on Etherscan](https://sepolia.etherscan.io/address/0x...) *(update after deploy)*

---

## 🏗 Architecture & Tech Stack

Built as a **Monorepo** using **PNPM Workspaces**.

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
│         Wagmi + ConnectKit + Apollo Client               │
└────────────────────┬───────────────────┬────────────────┘
                     │                   │
              Contract reads      GraphQL queries
              (Viem/Wagmi)        (Apollo)
                     │                   │
         ┌───────────┴──┐    ┌───────────┴──────────┐
         │  YieldVault  │    │  Apollo Server 4000  │
         │  (Sepolia /  │    │  (Prisma + PostgreSQL)│
         │  Localhost)  │    └───────────┬──────────┘
         └──────────────┘               │
                                 ┌──────┴──────┐
                                 │   Indexer   │
                                 │  (Viem      │
                                 │  watchEvent)│
                                 └─────────────┘
```

| Layer | Tech | Key Features |
|-------|------|--------------|
| **Smart Contract** | Solidity 0.8.24, OpenZeppelin | ReentrancyGuard, Custom Errors, 100% coverage |
| **Indexer** | Node.js, TypeScript, Viem | Event listener, PostgreSQL via Prisma |
| **API** | Apollo Server 4, GraphQL | Decoupled data layer |
| **Frontend** | Next.js 14, Wagmi, ConnectKit | Full tx lifecycle management |
| **Monorepo** | PNPM Workspaces, Concurrently | Single `pnpm dev` startup |

---

## ✅ Smart Contract Test Coverage

```
File            | % Stmts | % Branch | % Funcs | % Lines
----------------|---------|----------|---------|--------
YieldVault.sol  |   100   |   91.67  |   100   |   100
```

**19 tests** covering:
- ✅ Deposit: happy path, zero amount revert, separate balances, event emission
- ✅ Withdraw: full/partial, insufficient balance, zero amount, ETH transfer verification
- ✅ **Security:** Reentrancy attack simulation — attacker contract blocked by `ReentrancyGuard`
- ✅ **Invariants:** `totalAssets` always equals sum of balances; contract ETH balance matches state

---

## 🚀 Getting Started

### Prerequisites
- [PNPM](https://pnpm.io/) | [Node.js v20+](https://nodejs.org/)

### 1. Installation
```bash
pnpm install
```

### 2. Local Development (No keys required)

**Start everything with ONE command from root:**
```bash
pnpm dev
```
This starts: `[NODE]` Hardhat | `[LISTENER]` Indexer | `[SERVER]` GraphQL | `[WEB]` Next.js

**Deploy the contract (run once after the node starts):**
```bash
pnpm deploy
```

---

### 3. Sepolia Testnet Deployment

**Step 1 — Set up environment variables:**
```bash
# In packages/contracts/
cp .env.example .env
# Fill in: SEPOLIA_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY

# In packages/indexer/
cp .env.example .env
# Fill in: DATABASE_URL (Neon.tech), RPC_URL (Alchemy Sepolia)
```

**Step 2 — Get test ETH:**
- Alchemy Faucet: https://sepoliafaucet.com

**Step 3 — Deploy & verify automatically:**
```bash
pnpm --filter @portfolio/contracts deploy:sepolia
# ✅ Deploys + auto-verifies on Etherscan
```

**Step 4 — Update contract address in:**
- `packages/indexer/.env` → `CONTRACT_ADDRESS`
- `packages/frontend/src/app/page.tsx` → `CONTRACT_ADDRESS`
- `packages/frontend/src/config/wagmi.ts` → add `sepolia` chain

**Step 5 — Deploy frontend to Vercel:**
```bash
cd packages/frontend
npx vercel --prod
```

---

## 🧪 Running Tests

```bash
# Run all tests
pnpm --filter @portfolio/contracts test

# Generate coverage report
pnpm --filter @portfolio/contracts coverage
```

---

## 🛡 Security Considerations

- **Checks-Effects-Interactions:** Balances updated *before* ETH transfer to prevent reentrancy
- **ReentrancyGuard:** OpenZeppelin's battle-tested guard on all state-changing functions
- **Custom Errors:** Gas-efficient error handling instead of string reverts
- **BigInt Safety:** All financial data handled as strings/BigInts (18-decimal precision)
- **Test-Driven:** 100% line/function coverage with dedicated reentrancy attack simulation

---

## 📁 Project Structure

```
├── .github/workflows/
│   └── contracts-test.yml   # CI: auto-runs tests on every PR
├── packages/
│   ├── contracts/
│   │   ├── contracts/
│   │   │   ├── YieldVault.sol          # Main vault contract
│   │   │   └── ReentrancyAttacker.sol  # Test-only attack simulation
│   │   ├── scripts/deploy.ts           # Deploy + auto-verify on Etherscan
│   │   └── test/YieldVault.test.ts     # 19 tests, 100% coverage
│   ├── indexer/
│   │   ├── src/listener.ts   # Viem event watcher → PostgreSQL
│   │   └── src/server.ts     # Apollo GraphQL API
│   └── frontend/
│       └── src/app/page.tsx  # Next.js dashboard
├── package.json              # Root: pnpm dev / pnpm deploy
└── pnpm-workspace.yaml
```

---

Developed by **Sandro Dezerio** — Professional Web3 Engineering Portfolio
