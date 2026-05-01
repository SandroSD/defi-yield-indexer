// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IYieldVault {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

/**
 * @title ReentrancyAttacker
 * @dev Malicious contract used ONLY in tests to verify ReentrancyGuard works.
 * Attempts to re-enter withdraw() from within its receive() hook.
 * The attack should be blocked by OpenZeppelin's ReentrancyGuard.
 */
contract ReentrancyAttacker {
    IYieldVault public immutable vault;
    uint256 public attackAmount;
    bool public attackInProgress;

    constructor(address _vault) {
        vault = IYieldVault(_vault);
    }

    /// @dev Deposit 1 ETH, then immediately attempt to withdraw twice via reentrancy
    function attack() external payable {
        attackAmount = msg.value;
        attackInProgress = true;
        vault.deposit{ value: attackAmount }();
        // First legitimate withdraw — this triggers receive(), which tries to re-enter
        vault.withdraw(attackAmount);
        attackInProgress = false;
    }

    /// @dev This fires when the vault sends ETH back. We attempt to re-enter withdraw().
    receive() external payable {
        if (attackInProgress) {
            // Try to call withdraw again while we're inside the first withdraw
            vault.withdraw(attackAmount);
        }
    }
}
