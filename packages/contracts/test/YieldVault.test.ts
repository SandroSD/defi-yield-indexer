import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { YieldVault } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// ─── Fixture ────────────────────────────────────────────────────────────────
async function deployVaultFixture() {
  const [owner, alice, bob, attacker] = await ethers.getSigners();

  const YieldVaultFactory = await ethers.getContractFactory("YieldVault");
  const vault = await YieldVaultFactory.deploy();

  return { vault, owner, alice, bob, attacker };
}

// ─── Test Suite ─────────────────────────────────────────────────────────────
describe("YieldVault", function () {

  // ── Deployment ─────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("Should deploy with zero total assets", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      expect(await vault.totalAssets()).to.equal(0n);
    });
  });

  // ── Deposits ───────────────────────────────────────────────────────────
  describe("deposit()", function () {
    it("Should accept a deposit and update user balance", async function () {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      const amount = ethers.parseEther("1.0");

      await vault.connect(alice).deposit({ value: amount });

      expect(await vault.balances(alice.address)).to.equal(amount);
    });

    it("Should update totalAssets correctly after deposit", async function () {
      const { vault, alice, bob } = await loadFixture(deployVaultFixture);
      const amountA = ethers.parseEther("1.0");
      const amountB = ethers.parseEther("2.5");

      await vault.connect(alice).deposit({ value: amountA });
      await vault.connect(bob).deposit({ value: amountB });

      expect(await vault.totalAssets()).to.equal(amountA + amountB);
    });

    it("Should emit Deposit event with correct args", async function () {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      const amount = ethers.parseEther("1.0");

      await expect(vault.connect(alice).deposit({ value: amount }))
        .to.emit(vault, "Deposit")
        .withArgs(alice.address, amount, amount);
    });

    it("Should emit Deposit with cumulative newTotalBalance on second deposit", async function () {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      const first = ethers.parseEther("1.0");
      const second = ethers.parseEther("0.5");

      await vault.connect(alice).deposit({ value: first });

      await expect(vault.connect(alice).deposit({ value: second }))
        .to.emit(vault, "Deposit")
        .withArgs(alice.address, second, first + second);
    });

    it("Should revert with AmountMustBeGreaterThanZero on zero deposit", async function () {
      const { vault, alice } = await loadFixture(deployVaultFixture);

      await expect(vault.connect(alice).deposit({ value: 0n }))
        .to.be.revertedWithCustomError(vault, "AmountMustBeGreaterThanZero");
    });

    it("Should keep separate balances per user", async function () {
      const { vault, alice, bob } = await loadFixture(deployVaultFixture);
      const amountA = ethers.parseEther("1.0");
      const amountB = ethers.parseEther("3.0");

      await vault.connect(alice).deposit({ value: amountA });
      await vault.connect(bob).deposit({ value: amountB });

      expect(await vault.balances(alice.address)).to.equal(amountA);
      expect(await vault.balances(bob.address)).to.equal(amountB);
    });
  });

  // ── Withdrawals ────────────────────────────────────────────────────────
  describe("withdraw()", function () {
    it("Should allow a full withdrawal and zero the balance", async function () {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      const amount = ethers.parseEther("2.0");

      await vault.connect(alice).deposit({ value: amount });
      await vault.connect(alice).withdraw(amount);

      expect(await vault.balances(alice.address)).to.equal(0n);
    });

    it("Should allow a partial withdrawal and update balance correctly", async function () {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      const deposit = ethers.parseEther("2.0");
      const withdraw = ethers.parseEther("0.5");

      await vault.connect(alice).deposit({ value: deposit });
      await vault.connect(alice).withdraw(withdraw);

      expect(await vault.balances(alice.address)).to.equal(deposit - withdraw);
    });

    it("Should decrease totalAssets after withdrawal", async function () {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      const deposit = ethers.parseEther("3.0");
      const withdraw = ethers.parseEther("1.0");

      await vault.connect(alice).deposit({ value: deposit });
      await vault.connect(alice).withdraw(withdraw);

      expect(await vault.totalAssets()).to.equal(deposit - withdraw);
    });

    it("Should emit Withdraw event with correct args", async function () {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      const deposit = ethers.parseEther("2.0");
      const withdraw = ethers.parseEther("1.0");

      await vault.connect(alice).deposit({ value: deposit });

      await expect(vault.connect(alice).withdraw(withdraw))
        .to.emit(vault, "Withdraw")
        .withArgs(alice.address, withdraw, deposit - withdraw);
    });

    it("Should transfer ETH back to the user", async function () {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      const amount = ethers.parseEther("1.0");

      await vault.connect(alice).deposit({ value: amount });

      await expect(vault.connect(alice).withdraw(amount))
        .to.changeEtherBalance(alice, amount);
    });

    it("Should revert with InsufficientBalance if withdrawing more than deposited", async function () {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      const deposit = ethers.parseEther("1.0");
      const overflow = ethers.parseEther("1.1");

      await vault.connect(alice).deposit({ value: deposit });

      await expect(vault.connect(alice).withdraw(overflow))
        .to.be.revertedWithCustomError(vault, "InsufficientBalance");
    });

    it("Should revert with InsufficientBalance if user has no balance", async function () {
      const { vault, alice } = await loadFixture(deployVaultFixture);

      await expect(vault.connect(alice).withdraw(ethers.parseEther("1.0")))
        .to.be.revertedWithCustomError(vault, "InsufficientBalance");
    });

    it("Should revert with AmountMustBeGreaterThanZero on zero withdrawal", async function () {
      const { vault, alice } = await loadFixture(deployVaultFixture);
      const amount = ethers.parseEther("1.0");

      await vault.connect(alice).deposit({ value: amount });

      await expect(vault.connect(alice).withdraw(0n))
        .to.be.revertedWithCustomError(vault, "AmountMustBeGreaterThanZero");
    });

    it("Should not affect another user's balance during withdrawal", async function () {
      const { vault, alice, bob } = await loadFixture(deployVaultFixture);
      const amountA = ethers.parseEther("2.0");
      const amountB = ethers.parseEther("5.0");

      await vault.connect(alice).deposit({ value: amountA });
      await vault.connect(bob).deposit({ value: amountB });
      await vault.connect(alice).withdraw(amountA);

      expect(await vault.balances(bob.address)).to.equal(amountB);
    });
  });

  // ── Reentrancy Attack ───────────────────────────────────────────────────
  describe("Security: Reentrancy Attack", function () {
    it("Should block a reentrancy attack via ReentrancyGuard", async function () {
      const { vault, attacker } = await loadFixture(deployVaultFixture);

      const AttackerFactory = await ethers.getContractFactory("ReentrancyAttacker");
      const attackerContract = await AttackerFactory.connect(attacker).deploy(
        await vault.getAddress()
      );

      const attackAmount = ethers.parseEther("1.0");

      // The vault uses OZ ReentrancyGuard — transaction must revert entirely.
      await expect(
        attackerContract.connect(attacker).attack({ value: attackAmount })
      ).to.be.reverted;

      // After the reverted attack, the vault balance must be 0 —
      // the entire tx (including the initial deposit) was rolled back.
      const vaultBalance = await ethers.provider.getBalance(await vault.getAddress());
      expect(vaultBalance).to.equal(0n);
    });
  });


  // ── Invariants ─────────────────────────────────────────────────────────
  describe("Invariants", function () {
    it("totalAssets should always equal the sum of all user balances", async function () {
      const { vault, alice, bob, owner } = await loadFixture(deployVaultFixture);

      await vault.connect(alice).deposit({ value: ethers.parseEther("1.0") });
      await vault.connect(bob).deposit({ value: ethers.parseEther("2.0") });
      await vault.connect(owner).deposit({ value: ethers.parseEther("0.5") });
      await vault.connect(alice).withdraw(ethers.parseEther("0.3"));

      const sumOfBalances =
        (await vault.balances(alice.address)) +
        (await vault.balances(bob.address)) +
        (await vault.balances(owner.address));

      expect(await vault.totalAssets()).to.equal(sumOfBalances);
    });

    it("Contract ETH balance should match totalAssets", async function () {
      const { vault, alice, bob } = await loadFixture(deployVaultFixture);
      const vaultAddress = await vault.getAddress();

      await vault.connect(alice).deposit({ value: ethers.parseEther("1.5") });
      await vault.connect(bob).deposit({ value: ethers.parseEther("2.5") });
      await vault.connect(alice).withdraw(ethers.parseEther("0.5"));

      const contractBalance = await ethers.provider.getBalance(vaultAddress);
      expect(contractBalance).to.equal(await vault.totalAssets());
    });
  });
});
