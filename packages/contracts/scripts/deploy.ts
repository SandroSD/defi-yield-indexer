import { ethers, network, run } from "hardhat";

async function main() {
  console.log(`\n🚀 Deploying YieldVault Stack to network: ${network.name}...`);

  // 1. Deploy MockERC20
  console.log("\nDeploying MockERC20...");
  const mockToken = await ethers.deployContract("MockERC20");
  await mockToken.waitForDeployment();
  const tokenAddress = await mockToken.getAddress();
  console.log(`✅ MockERC20 deployed to: ${tokenAddress}`);

  // 2. Deploy MockV3Aggregator (Simulating a $1.00 stablecoin price with 8 decimals)
  console.log("\nDeploying MockV3Aggregator...");
  const INITIAL_PRICE = 100000000; // $1.00 (8 decimals)
  const mockAggregator = await ethers.deployContract("MockV3Aggregator", [8, INITIAL_PRICE]);
  await mockAggregator.waitForDeployment();
  const aggregatorAddress = await mockAggregator.getAddress();
  console.log(`✅ MockV3Aggregator deployed to: ${aggregatorAddress}`);

  // 3. Deploy YieldVault
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
      console.log("✅ Contracts verified on Etherscan!");
    } catch (e) {
      console.error("Verification error:", e);
    }
  }

  // Final summary for the frontend
  console.log("\n=============================================");
  console.log("🔥 DEPLOYMENT SUMMARY (Update these in frontend & indexer)");
  console.log("=============================================");
  console.log(`NEXT_PUBLIC_VAULT_ADDRESS=${contractAddress}`);
  console.log(`NEXT_PUBLIC_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`NEXT_PUBLIC_ORACLE_ADDRESS=${aggregatorAddress}`);
  console.log("=============================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
