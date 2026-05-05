import { http, createConfig } from 'wagmi'
import { sepolia, localhost } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [localhost, sepolia],
  connectors: [
    injected({ 
      target: 'metaMask',
      shimDisconnect: true 
    }),
  ],
  transports: {
    [localhost.id]: http(),
    [sepolia.id]: http(),
  },
})
