import { expect } from "chai";
import { ethers } from "hardhat";
import { YieldVault } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("YieldVault", function () {
  let yieldVault: YieldVault;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const YieldVaultFactory = await ethers.getContractFactory("YieldVault");
    yieldVault = await YieldVaultFactory.deploy();
  });

  describe("Deposits", function () {
    it("Should accept deposits and update balances", async function () {
      const depositAmount = ethers.parseEther("1.0");
      await expect(yieldVault.connect(addr1).deposit({ value: depositAmount }))
        .to.emit(yieldVault, "Deposit")
        .withArgs(addr1.address, depositAmount, depositAmount);

      expect(await yieldVault.balances(addr1.address)).to.equal(depositAmount);
    });

    it("Should revert if deposit amount is zero", async function () {
      await expect(yieldVault.connect(addr1).deposit({ value: 0 }))
        .to.be.revertedWithCustomError(yieldVault, "AmountMustBeGreaterThanZero");
    });
  });

  describe("Withdrawals", function () {
    it("Should allow withdrawals and update total assets", async function () {
      const depositAmount = ethers.parseEther("2.0");
      const withdrawAmount = ethers.parseEther("1.0");

      await yieldVault.connect(addr1).deposit({ value: depositAmount });
      
      await expect(yieldVault.connect(addr1).withdraw(withdrawAmount))
        .to.emit(yieldVault, "Withdraw")
        .withArgs(addr1.address, withdrawAmount, withdrawAmount);

      expect(await yieldVault.balances(addr1.address)).to.equal(withdrawAmount);
    });

    it("Should revert if balance is insufficient", async function () {
      const withdrawAmount = ethers.parseEther("1.0");
      await expect(yieldVault.connect(addr1).withdraw(withdrawAmount))
        .to.be.revertedWithCustomError(yieldVault, "InsufficientBalance");
    });
  });
});
