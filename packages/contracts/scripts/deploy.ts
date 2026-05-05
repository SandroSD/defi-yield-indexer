import { ethers, network, run } from "hardhat";

async function main() {
  console.log(`\n🚀 Deploying YieldVault Stack to network: ${network.name}...`);

  let tokenAddress: string;
  let aggregatorAddress: string;

  // 1. Handle Underlying Asset (MockERC20)
  console.log("\nDeploying MockERC20...");
  const mockToken = await ethers.deployContract("MockERC20");
  await mockToken.waitForDeployment();
  tokenAddress = await mockToken.getAddress();
  console.log(`✅ MockERC20 deployed to: ${tokenAddress}`);

  // 2. Handle Price Feed (Chainlink)
  // On Sepolia, we could use a real feed, but for this portfolio piece 
  // we deploy a Mock so we can control the 'mUSDC' price for the demo.
  console.log("\nDeploying MockV3Aggregator...");
  const INITIAL_PRICE = 100000000; // $1.00 (8 decimals)
  const mockAggregator = await ethers.deployContract("MockV3Aggregator", [8, INITIAL_PRICE]);
  await mockAggregator.waitForDeployment();
  aggregatorAddress = await mockAggregator.getAddress();
  console.log(`✅ MockV3Aggregator deployed to: ${aggregatorAddress}`);

  // 3. Deploy YieldVault (ERC-4626)
  console.log("\nDeploying YieldVault...");
  const yieldVault = await ethers.deployContract("YieldVault", [tokenAddress, aggregatorAddress]);
  await yieldVault.waitForDeployment();
  const contractAddress = await yieldVault.getAddress();
  console.log(`✅ YieldVault deployed to: ${contractAddress}`);

  // Verify on Etherscan only when deploying to a live network
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n⏳ Waiting 5 block confirmations before verifying...");
    await yieldVault.deploymentTransaction()?.wait(5);

    console.log("🔍 Verifying contracts on Etherscan...");
    try {
      await run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [],
      });
      await run("verify:verify", {
        address: aggregatorAddress,
        constructorArguments: [8, INITIAL_PRICE],
      });
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [tokenAddress, aggregatorAddress],
      });
      console.log("✅ All contracts verified on Etherscan!");
    } catch (e: any) {
      if (e.message.toLowerCase().includes("already verified")) {
        console.log("✅ Contracts already verified!");
      } else {
        console.error("Verification error:", e);
      }
    }
    console.log(`🔗 YieldVault: https://sepolia.etherscan.io/address/${contractAddress}`);
  }

  // Final summary for the frontend
  console.log("\n=================================================");
  console.log("🔥 DEPLOYMENT SUMMARY");
  console.log("=================================================");
  console.log(`NETWORK: ${network.name}`);
  console.log(`VAULT_ADDRESS: ${contractAddress}`);
  console.log(`TOKEN_ADDRESS: ${tokenAddress}`);
  console.log(`ORACLE_ADDRESS: ${aggregatorAddress}`);
  console.log("=================================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
