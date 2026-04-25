import { http, createConfig } from 'wagmi'
import { mainnet, localhost } from 'wagmi/chains'
import { getDefaultConfig } from 'connectkit'

export const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [localhost, mainnet],
    transports: {
      // RPC URL for each chain
      [localhost.id]: http('http://127.0.0.1:8545'),
      [mainnet.id]: http(),
    },

    // Required API Keys
    walletConnectProjectId: "fd377510d931934988716b472147a467", // Public demo key

    // Required App Info
    appName: "DeFi Yield Vault",

    // Optional App Info
    appDescription: "Your professional DeFi investment dashboard",
    appUrl: "https://family.co", // Your App's URL
    appIcon: "https://family.co/logo.png", // Your App's Icon
  }),
)
