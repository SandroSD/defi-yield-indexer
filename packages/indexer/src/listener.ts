import { createPublicClient, http, parseAbiItem, defineChain } from 'viem';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ── Chain configuration ───────────────────────────────────────────────────────
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = (process.env.CONTRACT_ADDRESS || '0x5fbdb2315678afecb367f032d93f642f64180aa3') as `0x${string}`;

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

// ── Event ABIs ────────────────────────────────────────────────────────────────
const depositEventAbi = parseAbiItem('event Deposit(address indexed user, uint256 amount, uint256 newTotalBalance)');
const withdrawEventAbi = parseAbiItem('event Withdraw(address indexed user, uint256 amount, uint256 newTotalBalance)');

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
        const { user, amount, newTotalBalance } = log.args;
        console.log(`📥 Deposit: ${amount?.toString()} wei from ${user} (block ${log.blockNumber})`);
        
        await prisma.transactionEvent.upsert({
          where: { transactionHash: log.transactionHash as string },
          update: {},
          create: {
            transactionHash: log.transactionHash as string,
            eventType: 'Deposit',
            userAddress: user as string,
            amount: amount?.toString() || '0',
            newTotalBalance: newTotalBalance?.toString() || '0',
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
        const { user, amount, newTotalBalance } = log.args;
        console.log(`📤 Withdraw: ${amount?.toString()} wei from ${user} (block ${log.blockNumber})`);
        
        await prisma.transactionEvent.upsert({
          where: { transactionHash: log.transactionHash as string },
          update: {},
          create: {
            transactionHash: log.transactionHash as string,
            eventType: 'Withdraw',
            userAddress: user as string,
            amount: amount?.toString() || '0',
            newTotalBalance: newTotalBalance?.toString() || '0',
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
