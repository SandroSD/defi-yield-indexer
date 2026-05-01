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
    assets: String!
    shares: String!
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
      // In a real app, this should probably be fetched from the contract directly or aggregated.
      // For this simplified version we'll just sum the current known state or return a mock since TVL is read from the contract in the frontend anyway.
      return "0";
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
