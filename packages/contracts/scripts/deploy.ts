import { ethers } from "hardhat";

async function main() {
  const yieldVault = await ethers.deployContract("YieldVault");

  await yieldVault.waitForDeployment();

  console.log(`✅ YieldVault deployed to: ${await yieldVault.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
