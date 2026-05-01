import { ethers, network, run } from "hardhat";

async function main() {
  console.log(`\n🚀 Deploying YieldVault to network: ${network.name}...`);

  const yieldVault = await ethers.deployContract("YieldVault");
  await yieldVault.waitForDeployment();

  const contractAddress = await yieldVault.getAddress();
  console.log(`✅ YieldVault deployed to: ${contractAddress}`);

  // Verify on Etherscan only when deploying to a live network
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n⏳ Waiting 5 block confirmations before verifying...");
    await yieldVault.deploymentTransaction()?.wait(5);

    console.log("🔍 Verifying contract on Etherscan...");
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("✅ Contract verified on Etherscan!");
    console.log(`🔗 https://sepolia.etherscan.io/address/${contractAddress}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
