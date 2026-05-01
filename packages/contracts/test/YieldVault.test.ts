import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { YieldVault, MockERC20, MockV3Aggregator } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("YieldVault (ERC-4626)", function () {
  async function deployVaultFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy Mock ERC20 (USDC)
    const mockToken = await ethers.deployContract("MockERC20");
    await mockToken.waitForDeployment();

    // Deploy Mock Chainlink Aggregator ($1.00 with 8 decimals)
    const initialPrice = 100000000;
    const mockAggregator = await ethers.deployContract("MockV3Aggregator", [8, initialPrice]);
    await mockAggregator.waitForDeployment();

    // Deploy Vault
    const yieldVault = await ethers.deployContract("YieldVault", [
      await mockToken.getAddress(),
      await mockAggregator.getAddress(),
    ]);
    await yieldVault.waitForDeployment();

    // Mint some mock tokens to users
    const mintAmount = ethers.parseUnits("1000", 6); // 1000 USDC
    await mockToken.mint(user1.address, mintAmount);
    await mockToken.mint(user2.address, mintAmount);

    return { yieldVault, mockToken, mockAggregator, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the correct asset", async function () {
      const { yieldVault, mockToken } = await loadFixture(deployVaultFixture);
      expect(await yieldVault.asset()).to.equal(await mockToken.getAddress());
    });

    it("Should set the correct oracle", async function () {
      const { yieldVault, mockAggregator } = await loadFixture(deployVaultFixture);
      expect(await yieldVault.dataFeed()).to.equal(await mockAggregator.getAddress());
    });
  });

  describe("Deposits and Shares (ERC-4626)", function () {
    it("Should allow users to deposit tokens and receive shares", async function () {
      const { yieldVault, mockToken, user1 } = await loadFixture(deployVaultFixture);
      
      const depositAmount = ethers.parseUnits("100", 6);
      
      // Approve vault to spend tokens
      await mockToken.connect(user1).approve(await yieldVault.getAddress(), depositAmount);
      
      // Deposit
      await expect(yieldVault.connect(user1).deposit(depositAmount, user1.address))
        .to.emit(yieldVault, "Deposit")
        .withArgs(user1.address, user1.address, depositAmount, depositAmount); // 1:1 shares

      expect(await yieldVault.balanceOf(user1.address)).to.equal(depositAmount);
      expect(await yieldVault.totalAssets()).to.equal(depositAmount);
    });
  });

  describe("Withdrawals (ERC-4626)", function () {
    it("Should allow users to withdraw tokens by burning shares", async function () {
      const { yieldVault, mockToken, user1 } = await loadFixture(deployVaultFixture);
      
      const depositAmount = ethers.parseUnits("100", 6);
      await mockToken.connect(user1).approve(await yieldVault.getAddress(), depositAmount);
      await yieldVault.connect(user1).deposit(depositAmount, user1.address);
      
      const withdrawAmount = ethers.parseUnits("50", 6);
      
      await expect(yieldVault.connect(user1).withdraw(withdrawAmount, user1.address, user1.address))
        .to.emit(yieldVault, "Withdraw")
        .withArgs(user1.address, user1.address, user1.address, withdrawAmount, withdrawAmount);

      expect(await yieldVault.balanceOf(user1.address)).to.equal(ethers.parseUnits("50", 6));
      expect(await yieldVault.totalAssets()).to.equal(ethers.parseUnits("50", 6));
    });
  });

  describe("Chainlink Oracle Integration", function () {
    it("Should return the correct USD value based on total assets", async function () {
      const { yieldVault, mockToken, mockAggregator, user1 } = await loadFixture(deployVaultFixture);
      
      // Deposit 100 USDC
      const depositAmount = ethers.parseUnits("100", 6);
      await mockToken.connect(user1).approve(await yieldVault.getAddress(), depositAmount);
      await yieldVault.connect(user1).deposit(depositAmount, user1.address);
      
      // Oracle is set to $1.00 (100000000)
      // Total assets: 100 USDC (100_000_000)
      // Value should be 100_000_000 * 100000000 / 10**6 = 100_000_00000
      // 100 USD in 8 decimals is 100 * 10^8 = 10000000000
      expect(await yieldVault.getTotalValueUSD()).to.equal(10000000000n);

      // Change price to $2.00 (200000000)
      await mockAggregator.updateAnswer(200000000);
      expect(await yieldVault.getTotalValueUSD()).to.equal(20000000000n); // 200 USD
    });

    it("Should return 0 USD value if total assets are 0", async function () {
      const { yieldVault } = await loadFixture(deployVaultFixture);
      expect(await yieldVault.getTotalValueUSD()).to.equal(0n);
    });

    it("Should return 0 USD value if oracle returns negative price", async function () {
      const { yieldVault, mockToken, mockAggregator, user1 } = await loadFixture(deployVaultFixture);
      
      const depositAmount = ethers.parseUnits("100", 6);
      await mockToken.connect(user1).approve(await yieldVault.getAddress(), depositAmount);
      await yieldVault.connect(user1).deposit(depositAmount, user1.address);

      await mockAggregator.updateAnswer(-100000000);
      expect(await yieldVault.getTotalValueUSD()).to.equal(0n);
    });

    it("Should return 0 USD value if oracle returns exactly 0", async function () {
        const { yieldVault, mockToken, mockAggregator, user1 } = await loadFixture(deployVaultFixture);
        
        const depositAmount = ethers.parseUnits("100", 6);
        await mockToken.connect(user1).approve(await yieldVault.getAddress(), depositAmount);
        await yieldVault.connect(user1).deposit(depositAmount, user1.address);
  
        await mockAggregator.updateAnswer(0);
        expect(await yieldVault.getTotalValueUSD()).to.equal(0n);
    });
  });
});
