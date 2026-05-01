// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @dev A mock ERC20 token for local testing and testnets.
 * Simulates a stablecoin like USDC.
 */
contract MockERC20 is ERC20, Ownable {
    constructor() ERC20("Mock USDC", "mUSDC") Ownable(msg.sender) {}

    /**
     * @dev Mint tokens for testing.
     * @param to The address to receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    /**
     * @dev Override decimals to match USDC (6 decimals)
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
