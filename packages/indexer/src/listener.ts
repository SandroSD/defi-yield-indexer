import { createPublicClient, http, parseAbiItem, defineChain } from 'viem';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Forzamos el ID 1337 para el indexador
const local1337 = defineChain({
  id: 1337,
  name: 'Localhost 1337',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
});

const client = createPublicClient({
  chain: local1337,
  transport: http(),
});

const depositEventAbi = parseAbiItem('event Deposit(address indexed user, uint256 amount, uint256 newTotalBalance)');
const withdrawEventAbi = parseAbiItem('event Withdraw(address indexed user, uint256 amount, uint256 newTotalBalance)');

const CONTRACT_ADDRESS = '0x5fbdb2315678afecb367f032d93f642f64180aa3'; 

async function startListening() {
  console.log('🎧 Starting Blockchain Indexer on Chain 1337...');
  console.log(`📡 Watching contract: ${CONTRACT_ADDRESS}`);

  client.watchEvent({
    address: CONTRACT_ADDRESS,
    event: depositEventAbi,
    onLogs: async (logs) => {
      for (const log of logs) {
        const { user, amount, newTotalBalance } = log.args;
        console.log(`📥 Deposit Detected: ${amount?.toString()} wei from ${user}`);
        
        await prisma.transactionEvent.upsert({
          where: { transactionHash: log.transactionHash as string },
          update: {},
          create: {
            transactionHash: log.transactionHash as string,
            eventType: 'Deposit',
            userAddress: user as string,
            amount: amount?.toString() || '0',
            newTotalBalance: newTotalBalance?.toString() || '0',
            blockNumber: Number(log.blockNumber)
          }
        });
      }
    }
  });

  client.watchEvent({
    address: CONTRACT_ADDRESS,
    event: withdrawEventAbi,
    onLogs: async (logs) => {
      for (const log of logs) {
        const { user, amount, newTotalBalance } = log.args;
        console.log(`📤 Withdraw Detected: ${amount?.toString()} wei from ${user}`);
        
        await prisma.transactionEvent.upsert({
          where: { transactionHash: log.transactionHash as string },
          update: {},
          create: {
            transactionHash: log.transactionHash as string,
            eventType: 'Withdraw',
            userAddress: user as string,
            amount: amount?.toString() || '0',
            newTotalBalance: newTotalBalance?.toString() || '0',
            blockNumber: Number(log.blockNumber)
          }
        });
      }
    }
  });
}

startListening().catch(console.error);
