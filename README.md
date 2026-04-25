# 🚀 DeFi Yield Vault & Real-Time Indexer

A professional-grade DeFi portfolio project demonstrating a full-stack Web3 architecture. This project features a secure Ethereum Smart Contract, a high-performance Event Indexer, and a modern React Dashboard.

![Architecture Diagram](https://mermaid.ink/img/pako:eNptkctuwjAQRX_FmmsqReIDW6BKCAnSREUfXfAwmAnYOHZkT4tS_ffasYvUlb2ZuefOHeuOEmkhSVTX68ZpS6X9vYkscXq6fS9AAs-u_u1w7lG3Z0e_N-R0oI04K7H9LAnuH_i_v53O9XCH0_U8P8C3uXvA5-G6O5790S_99_m6X-66D6r2E_Xm2iIlyfM5M0M19E63tG_f6L_P-7vX4I9n9S1qgUooN6D0EAtUIn7lF_5XvuZ_-V_5p_6Xf2S_ZOfYvFAb-IAsOIn8Nis7w_yGrvO77Cqr-11V6Uo3uk9Wz6yeeR35DVk7sqZ_X1V94VbeZ-vM6pXVN6_X_p_sI7vC9uXfAeoBy7c?type=png)

## 🏗 Architecture & Tech Stack

This project is built as a **Monorepo** using **PNPM Workspaces** for maximum efficiency and strict dependency management.

- **Smart Contracts**: Solidity 0.8.24, Hardhat, OpenZeppelin (ReentrancyGuard).
- **Backend (Indexer)**: Node.js, TypeScript, **Viem** (Blockchain Listener), **Prisma** (SQLite ORM).
- **API**: **Apollo Server** (GraphQL) for efficient data fetching.
- **Frontend**: **Next.js 14** (App Router), **Tailwind CSS**, **Wagmi**, **ConnectKit**.

## 🌟 Key Features

- **Secure Yield Vault**: Implements a vault pattern with protection against reentrancy attacks and zero-value deposits.
- **Real-Time Indexing**: A dedicated Node.js service listens for contract events (`Deposit`, `Withdraw`) and persists them to a local database.
- **GraphQL API**: Decouples the frontend from the blockchain, providing a high-speed interface for transaction history and TVL metrics.
- **Premium UI**: Modern dark-mode dashboard with real-time "Live Activity" feed powered by GraphQL polling.

## 📁 Project Structure

```text
├── packages/
│   ├── contracts/    # Hardhat setup, Solidity contracts, and Unit Tests
│   ├── indexer/      # Node.js service (Event Listener + GraphQL Server)
│   └── frontend/     # Next.js Application (Wagmi + Tailwind)
├── pnpm-workspace.yaml
└── tsconfig.json
```

## 🚀 Getting Started

### 1. Prerequisites
- [PNPM](https://pnpm.io/)
- [Node.js](https://nodejs.org/) (v18+)

### 2. Installation
```bash
pnpm install
```

### 3. Setup & Run

**Step A: Run Local Blockchain**
```bash
cd packages/contracts
npx hardhat node
```

**Step B: Deploy Contract & Indexer Setup**
```bash
# In another terminal
cd packages/indexer
pnpm db:push
pnpm generate
```

**Step C: Start Services**
```bash
# Start the Listener (to watch the blockchain)
pnpm run dev:listener

# Start the GraphQL Server (to serve the UI)
pnpm run dev:server

# Start the Frontend (in a new terminal)
cd packages/frontend
pnpm dev
```

## 🛡 Security Considerations
- **Checks-Effects-Interactions**: Used in all vault functions to prevent reentrancy.
- **Strict Typing**: TypeScript is used throughout the entire stack to ensure data integrity.
- **BigInt Safety**: Financial data is handled as strings/BigInts to maintain 18-decimal precision.

---
Developed by **Sandro Dezerio** as part of a professional Web3 Engineering portfolio.
