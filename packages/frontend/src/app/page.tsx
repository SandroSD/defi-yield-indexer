"use client";

import { useState } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { useQuery, gql } from "@apollo/client";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Activity, LayoutDashboard, Clock } from "lucide-react";

// Query para nuestro indexador
const GET_RECENT_TXS = gql`
  query GetRecentTxs {
    recentTransactions(limit: 5) {
      id
      eventType
      amount
      userAddress
      transactionHash
    }
  }
`;

// Dirección del contrato...
const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const ABI = [
  {"inputs":[],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonReentrant","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balances","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalAssets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
] as const;

export default function Home() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");

  // 1. Leer datos del Contrato
  const { data: userVaultBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "balances",
    args: [address!],
    query: { enabled: !!address }
  });

  const { data: totalVaultAssets } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "totalAssets",
  });

  // 2. Escribir en el Contrato (Transacciones)
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleDeposit = () => {
    if (!amount) return;
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "deposit",
      value: parseEther(amount),
    });
  };

  const handleWithdraw = () => {
    if (!amount) return;
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "withdraw",
      args: [parseEther(amount)],
    });
  };

  // 3. Consultar datos del Indexador GraphQL
  const { data: indexerData, loading: indexerLoading } = useQuery(GET_RECENT_TXS, {
    pollInterval: 5000, // Refrescar cada 5 segundos
  });

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      {/* Header */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <LayoutDashboard size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Charged Cosmos DeFi</h1>
        </div>
        <ConnectKitButton />
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Estadísticas Principales */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
              <div className="flex justify-between items-start mb-4">
                <p className="text-gray-400 text-sm">Total Value Locked</p>
                <Activity className="text-blue-500" size={20} />
              </div>
              <h2 className="text-3xl font-bold">
                {totalVaultAssets ? formatEther(totalVaultAssets) : "0.00"} <span className="text-sm font-normal text-gray-500">ETH</span>
              </h2>
            </div>
            <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
              <div className="flex justify-between items-start mb-4">
                <p className="text-gray-400 text-sm">Your Vault Balance</p>
                <Wallet className="text-green-500" size={20} />
              </div>
              <h2 className="text-3xl font-bold">
                {userVaultBalance ? formatEther(userVaultBalance) : "0.00"} <span className="text-sm font-normal text-gray-500">ETH</span>
              </h2>
            </div>
          </div>

          {/* Formulario de Interacción */}
          <div className="bg-[#141414] border border-white/5 p-8 rounded-2xl">
            <h3 className="text-lg font-semibold mb-6">Vault Management</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount (ETH)</label>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {!isConnected ? (
                <div className="text-center p-4 bg-blue-600/10 border border-blue-600/20 rounded-xl">
                  <p className="text-blue-400 text-sm">Connect your wallet to interact with the vault</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleDeposit}
                    disabled={isPending || isConfirming}
                    className="flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    <ArrowUpCircle size={20} />
                    {isPending ? "Pending..." : "Deposit"}
                  </button>
                  <button 
                    onClick={handleWithdraw}
                    disabled={isPending || isConfirming}
                    className="flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    <ArrowDownCircle size={20} />
                    {isPending ? "Pending..." : "Withdraw"}
                  </button>
                </div>
              )}
            </div>
            
            {(isConfirming || isSuccess) && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-green-400 text-sm">
                  {isConfirming ? "Waiting for confirmation..." : "Transaction successful!"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Indexer Activity */}
        <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" />
            Live Activity
          </h3>
          <div className="space-y-4">
            {indexerLoading && <p className="text-xs text-gray-500">Loading events...</p>}
            
            {indexerData?.recentTransactions.map((tx: any) => (
              <div key={tx.id} className="p-4 bg-[#0a0a0a] rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={12} className="text-gray-500" />
                  <p className="text-xs text-gray-500">{tx.eventType}</p>
                </div>
                <p className="text-sm font-medium">
                  {formatEther(BigInt(tx.amount))} ETH
                </p>
                <p className="text-[10px] text-blue-500 mt-2 font-mono truncate">
                  {tx.transactionHash}
                </p>
              </div>
            ))}

            {!indexerLoading && indexerData?.recentTransactions.length === 0 && (
              <p className="text-xs text-gray-500 italic text-center">No transactions indexed yet.</p>
            )}

            <p className="text-center text-xs text-gray-600 mt-4 italic border-t border-white/5 pt-4">
              Real-time GraphQL Indexer
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
