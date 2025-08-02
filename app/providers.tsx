"use client"

import React, { type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider, createConfig, http } from "wagmi"
import { defineChain } from 'viem'

const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
})

// 1. Get projectId
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

// 2. Create wagmiConfig
const metadata = {
  name: "Time Cafe",
  description: "A pixel art cafe for frens",
  url: "https://time.cafe", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
}

export const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
  ssr: true,
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
