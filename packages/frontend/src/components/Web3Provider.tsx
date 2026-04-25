"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from "@apollo/client";
import { config } from "@/config/wagmi";

const queryClient = new QueryClient();

const httpLink = createHttpLink({
  uri: "http://localhost:4000",
});

const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={apolloClient}>
          {children}
        </ApolloProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
