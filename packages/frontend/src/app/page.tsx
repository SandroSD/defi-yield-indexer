"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useConnect, useDisconnect } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useQuery, gql } from "@apollo/client/index";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Activity, LayoutDashboard, Clock, Power, Coins, ShieldCheck, DollarSign } from "lucide-react";

// Query for Indexer
const GET_RECENT_TXS = gql`
  query GetRecentTxs {
    recentTransactions(limit: 5) {
      id
      eventType
      assets
      userAddress
      transactionHash
    }
  }
`;

// Deployed Addresses (localhost)
const VAULT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" as const;
const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3" as const;

// ABIs
const VAULT_ABI = [
  {"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"deposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalAssets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getTotalValueUSD","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
] as const;

const TOKEN_ABI = [
  {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"}
] as const;

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [amount, setAmount] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleDisconnect = () => {
    disconnect();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wagmi.store');
      localStorage.removeItem('wagmi.connected');
      localStorage.removeItem('wagmi.recentConnectorId');
      window.location.reload();
    }
  };

  // ── MULTICALL: Fetch all on-chain data in a single RPC request ──────────────
  const { data: multicallData, refetch } = useReadContracts({
    contracts: [
      { address: VAULT_ADDRESS, abi: VAULT_ABI, functionName: 'totalAssets' },
      { address: VAULT_ADDRESS, abi: VAULT_ABI, functionName: 'getTotalValueUSD' },
      { address: VAULT_ADDRESS, abi: VAULT_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] },
      { address: TOKEN_ADDRESS, abi: TOKEN_ABI, functionName: 'balanceOf', args: [address as `0x${string}`] },
      { address: TOKEN_ADDRESS, abi: TOKEN_ABI, functionName: 'allowance', args: [address as `0x${string}`, VAULT_ADDRESS] },
    ],
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Poll every 5s
    }
  });

  const [
    totalVaultAssetsRes,
    totalVaultValueUSDRes,
    userVaultSharesRes,
    userTokenBalanceRes,
    userTokenAllowanceRes
  ] = multicallData || [];

  const totalVaultAssets = totalVaultAssetsRes?.result as bigint | undefined;
  const totalVaultValueUSD = totalVaultValueUSDRes?.result as bigint | undefined;
  const userVaultShares = userVaultSharesRes?.result as bigint | undefined; // For 1:1, shares = assets
  const userTokenBalance = userTokenBalanceRes?.result as bigint | undefined;
  const userTokenAllowance = userTokenAllowanceRes?.result as bigint | undefined;

  // ── TRANSACTIONS ────────────────────────────────────────────────────────────
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Refresh data when a transaction confirms
  useEffect(() => {
    if (isSuccess) refetch();
  }, [isSuccess, refetch]);

  const parsedAmount = amount ? parseUnits(amount, 6) : BigInt(0); // USDC uses 6 decimals
  const needsApproval = userTokenAllowance !== undefined && parsedAmount > userTokenAllowance;

  const handleMintTokens = () => {
    writeContract({
      address: TOKEN_ADDRESS,
      abi: TOKEN_ABI,
      functionName: "mint",
      args: [address as `0x${string}`, parseUnits("1000", 6)], // Mint 1000 mUSDC
    });
  };

  const handleApprove = () => {
    if (!amount) return;
    writeContract({
      address: TOKEN_ADDRESS,
      abi: TOKEN_ABI,
      functionName: "approve",
      args: [VAULT_ADDRESS, parsedAmount],
    });
  };

  const handleDeposit = () => {
    if (!amount) return;
    writeContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "deposit",
      args: [parsedAmount, address as `0x${string}`],
    });
  };

  const handleWithdraw = () => {
    if (!amount) return;
    writeContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "withdraw",
      args: [parsedAmount, address as `0x${string}`, address as `0x${string}`],
    });
  };

  // ── INDEXER DATA ────────────────────────────────────────────────────────────
  const { data: indexerData, loading: indexerLoading } = useQuery(GET_RECENT_TXS, {
    pollInterval: 5000,
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#121212] text-white p-4 md:p-8 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-12 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <LayoutDashboard size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Yield Cosmos</h1>
            <p className="text-xs text-blue-400 font-mono tracking-widest uppercase">ERC-4626 Vault</p>
          </div>
        </div>
        
        {mounted && (
          isConnected ? (
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-green-400 uppercase tracking-widest font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Connected
                </span>
                <span className="text-sm font-mono text-gray-200">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
              <div className="w-px h-8 bg-white/10 mx-1"></div>
              <button 
                onClick={handleDisconnect}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all text-red-400 group"
                title="Disconnect Wallet"
              >
                <Power size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => connect({ connector: connectors[0] })}
              className="bg-white hover:bg-gray-100 text-black text-sm font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <Wallet size={18} />
              Connect Wallet
            </button>
          )
        )}
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Management */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1c1c1e] to-[#121212] border border-white/5 p-6 rounded-3xl shadow-xl">
              <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-gray-400 text-sm font-medium">Protocol TVL</p>
                <Activity className="text-blue-500" size={20} />
              </div>
              <h2 className="text-4xl font-bold tracking-tight relative z-10">
                {totalVaultAssets !== undefined ? formatUnits(totalVaultAssets, 6) : "0.00"} <span className="text-lg font-medium text-gray-500">mUSDC</span>
              </h2>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-green-400 bg-green-400/10 w-fit px-2.5 py-1 rounded-lg border border-green-400/20 relative z-10">
                <DollarSign size={14} />
                <span>{totalVaultValueUSD !== undefined ? formatUnits(totalVaultValueUSD, 8) : "0.00"} USD</span>
              </div>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-[#1c1c1e] to-[#121212] border border-white/5 p-6 rounded-3xl shadow-xl">
              <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-gray-400 text-sm font-medium">Your Vault Balance</p>
                <Wallet className="text-indigo-400" size={20} />
              </div>
              <h2 className="text-4xl font-bold tracking-tight relative z-10">
                {userVaultShares !== undefined ? formatUnits(userVaultShares, 6) : "0.00"} <span className="text-lg font-medium text-gray-500">yvUSDC</span>
              </h2>
              <p className="mt-2 text-sm text-gray-500 font-mono relative z-10 flex items-center gap-2">
                <Coins size={14} />
                Wallet: {userTokenBalance !== undefined ? formatUnits(userTokenBalance, 6) : "0.00"} mUSDC
              </p>
            </div>
          </div>

          {/* Action Box */}
          <div className="bg-[#141414] border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-xl font-bold tracking-tight">Vault Management</h3>
              {mounted && isConnected && (
                <button onClick={handleMintTokens} className="text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all text-blue-400 flex items-center gap-1.5">
                  <Coins size={12} /> Faucet: +1000 mUSDC
                </button>
              )}
            </div>

            <div className="space-y-6 relative z-10">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Amount (mUSDC)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-lg"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                    <button onClick={() => setAmount(userTokenBalance ? formatUnits(userTokenBalance, 6) : "0")} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-gray-300 font-semibold transition-colors">MAX</button>
                  </div>
                </div>
              </div>

              {mounted && !isConnected && (
                <div className="text-center p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl backdrop-blur-sm">
                  <p className="text-blue-400 font-medium">Connect your wallet to interact with the ERC-4626 Vault</p>
                </div>
              )}

              {mounted && isConnected && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  {needsApproval ? (
                    <button 
                      onClick={handleApprove}
                      disabled={isPending || isConfirming}
                      className="col-span-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                    >
                      <ShieldCheck size={20} />
                      {isPending ? "Approving..." : "Approve mUSDC"}
                    </button>
                  ) : (
                    <button 
                      onClick={handleDeposit}
                      disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0 || (userTokenBalance !== undefined && parsedAmount > userTokenBalance)}
                      className="col-span-1 flex items-center justify-center gap-2 bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                      <ArrowUpCircle size={20} />
                      {userTokenBalance !== undefined && parsedAmount > userTokenBalance ? "Insufficient Balance" : (isPending ? "Pending..." : "Deposit")}
                    </button>
                  )}

                  <button 
                    onClick={handleWithdraw}
                    disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0 || (userVaultShares !== undefined && parsedAmount > userVaultShares)}
                    className="col-span-1 flex items-center justify-center gap-2 border border-white/10 bg-[#1a1a1a] hover:bg-[#222] font-bold py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                  >
                    <ArrowDownCircle size={20} />
                    {userVaultShares !== undefined && parsedAmount > userVaultShares ? "Insufficient Shares" : (isPending ? "Pending..." : "Withdraw")}
                  </button>
                </div>
              )}
            </div>
            
            {(isConfirming || isSuccess) && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl relative z-10">
                <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                  <span className={isConfirming ? "animate-pulse" : ""}>
                    {isConfirming ? "⏳ Transaction confirming on blockchain..." : "✅ Transaction successfully confirmed!"}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Indexer Feed */}
        <div className="bg-[#141414] border border-white/5 p-6 rounded-3xl shadow-xl h-fit">
          <h3 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" />
            Live Event Indexer
          </h3>
          <div className="space-y-4">
            {indexerLoading && (
              <div className="flex items-center justify-center p-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {indexerData?.recentTransactions.map((tx: any) => (
              <div key={tx.id} className="p-4 bg-[#0a0a0a] rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-gray-500" />
                    <p className={`text-xs font-bold ${tx.eventType === 'Deposit' ? 'text-green-400' : 'text-blue-400'}`}>
                      {tx.eventType}
                    </p>
                  </div>
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${tx.transactionHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-gray-500 hover:text-white transition-colors"
                  >
                    View Tx ↗
                  </a>
                </div>
                <p className="text-lg font-bold">
                  {formatUnits(BigInt(tx.assets), 6)} <span className="text-xs font-normal text-gray-500">mUSDC</span>
                </p>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                    <Wallet size={10} />
                    {tx.userAddress.slice(0, 6)}...{tx.userAddress.slice(-4)}
                  </p>
                </div>
              </div>
            ))}

            {!indexerLoading && (!indexerData?.recentTransactions || indexerData.recentTransactions.length === 0) && (
              <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl">
                <p className="text-xs text-gray-500 italic">Listening for ERC-4626 events...</p>
              </div>
            )}

            <div className="text-center pt-4 mt-2 border-t border-white/5">
              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                Powered by GraphQL
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
