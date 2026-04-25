// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title YieldVault
 * @dev A simple vault for depositing and withdrawing ETH.
 * Demonstrates security best practices and event emission for indexing.
 */
contract YieldVault is ReentrancyGuard {
    mapping(address => uint256) public balances;
    uint256 public totalAssets;

    event Deposit(address indexed user, uint256 amount, uint256 newTotalBalance);
    event Withdraw(address indexed user, uint256 amount, uint256 newTotalBalance);

    error InsufficientBalance();
    error AmountMustBeGreaterThanZero();

    /**
     * @dev Deposit ETH into the vault.
     */
    function deposit() external payable nonReentrant {
        if (msg.value == 0) revert AmountMustBeGreaterThanZero();

        balances[msg.sender] += msg.value;
        totalAssets += msg.value;

        emit Deposit(msg.sender, msg.value, balances[msg.sender]);
    }

    /**
     * @dev Withdraw ETH from the vault.
     * @param amount The amount of ETH to withdraw.
     */
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert AmountMustBeGreaterThanZero();
        if (balances[msg.sender] < amount) revert InsufficientBalance();

        balances[msg.sender] -= amount;
        totalAssets -= amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert("Transfer failed");

        emit Withdraw(msg.sender, amount, balances[msg.sender]);
    }

    receive() external payable {
        // Fallback for direct ETH transfers
    }
}
