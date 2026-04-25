import { http, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'

// Definimos una red personalizada para forzar el ID 1337
const local1337 = {
  id: 1337,
  name: 'Localhost 1337',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
} as const;

export const config = createConfig({
  chains: [local1337],
  connectors: [
    injected({ 
      target: 'metaMask',
      shimDisconnect: true 
    }),
  ],
  transports: {
    [local1337.id]: http('http://127.0.0.1:8545'),
  },
})
