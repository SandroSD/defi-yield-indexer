"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { localhost } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { config } from "@/config/wagmi";

const queryClient = new QueryClient();

const apolloClient = new ApolloClient({
  uri: "http://localhost:4000", // Nuestra API del indexador
  cache: new InMemoryCache(),
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={apolloClient}>
          <ConnectKitProvider>{children}</ConnectKitProvider>
        </ApolloProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
