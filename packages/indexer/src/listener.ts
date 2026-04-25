import { createPublicClient, http, parseAbiItem } from 'viem';
import { localhost } from 'viem/chains';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const client = createPublicClient({
  chain: localhost,
  transport: http(),
});

const depositEventAbi = parseAbiItem('event Deposit(address indexed user, uint256 amount, uint256 newTotalBalance)');
const withdrawEventAbi = parseAbiItem('event Withdraw(address indexed user, uint256 amount, uint256 newTotalBalance)');

const CONTRACT_ADDRESS = '0x5fbdb2315678afecb367f032d93f642f64180aa3'; 

async function startListening() {
  console.log('🎧 Starting Blockchain Indexer...');

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
