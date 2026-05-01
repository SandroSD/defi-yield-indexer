import { createPublicClient, http, parseAbiItem, defineChain } from 'viem';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ── Chain configuration ───────────────────────────────────────────────────────
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = (process.env.CONTRACT_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0') as `0x${string}`;

// Detect chain dynamically from the RPC (Sepolia = 11155111, local = 1337)
const isLocalNetwork = RPC_URL.includes('127.0.0.1') || RPC_URL.includes('localhost');

const localChain = defineChain({
  id: 1337,
  name: 'Localhost 1337',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
});

const sepoliaChain = defineChain({
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
});

const chain = isLocalNetwork ? localChain : sepoliaChain;

const client = createPublicClient({
  chain,
  transport: http(RPC_URL),
});

// ── Event ABIs (ERC-4626) ──────────────────────────────────────────────────────
const depositEventAbi = parseAbiItem('event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)');
const withdrawEventAbi = parseAbiItem('event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)');

// ── Main listener ─────────────────────────────────────────────────────────────
async function startListening() {
  console.log(`\n🎧 Starting Blockchain Indexer`);
  console.log(`📡 Network: ${chain.name} (Chain ID: ${chain.id})`);
  console.log(`📍 Contract: ${CONTRACT_ADDRESS}`);
  console.log(`🔗 RPC: ${RPC_URL}\n`);

  client.watchEvent({
    address: CONTRACT_ADDRESS,
    event: depositEventAbi,
    onLogs: async (logs) => {
      for (const log of logs) {
        const { owner, assets, shares } = log.args;
        console.log(`📥 Deposit: ${assets?.toString()} assets from ${owner} (block ${log.blockNumber})`);
        
        await prisma.transactionEvent.upsert({
          where: { transactionHash: log.transactionHash as string },
          update: {},
          create: {
            transactionHash: log.transactionHash as string,
            eventType: 'Deposit',
            userAddress: owner as string,
            assets: assets?.toString() || '0',
            shares: shares?.toString() || '0',
            blockNumber: Number(log.blockNumber),
          },
        });
      }
    },
    onError: (error) => {
      console.error('❌ Deposit listener error:', error.message);
    },
  });

  client.watchEvent({
    address: CONTRACT_ADDRESS,
    event: withdrawEventAbi,
    onLogs: async (logs) => {
      for (const log of logs) {
        const { owner, assets, shares } = log.args;
        console.log(`📤 Withdraw: ${assets?.toString()} assets from ${owner} (block ${log.blockNumber})`);
        
        await prisma.transactionEvent.upsert({
          where: { transactionHash: log.transactionHash as string },
          update: {},
          create: {
            transactionHash: log.transactionHash as string,
            eventType: 'Withdraw',
            userAddress: owner as string,
            assets: assets?.toString() || '0',
            shares: shares?.toString() || '0',
            blockNumber: Number(log.blockNumber),
          },
        });
      }
    },
    onError: (error) => {
      console.error('❌ Withdraw listener error:', error.message);
    },
  });
}

startListening().catch(console.error);
