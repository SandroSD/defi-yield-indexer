import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const typeDefs = `#graphql
  type TransactionEvent {
    id: ID!
    transactionHash: String!
    eventType: String!
    userAddress: String!
    amount: String!
    newTotalBalance: String!
    blockNumber: Int!
    createdAt: String!
  }

  type Query {
    recentTransactions(limit: Int): [TransactionEvent!]!
    getTotalValueLocked: String!
  }
`;

const resolvers = {
  Query: {
    recentTransactions: async (_, { limit = 10 }) => {
      return await prisma.transactionEvent.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    },
    getTotalValueLocked: async () => {
      const latestTx = await prisma.transactionEvent.findFirst({
        orderBy: { blockNumber: 'desc' }
      });
      return latestTx ? latestTx.newTotalBalance : "0";
    }
  },
};

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log(`🚀 GraphQL API ready at: ${url}`);
}

startServer();
