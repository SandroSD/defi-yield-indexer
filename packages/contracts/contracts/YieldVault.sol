// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title YieldVault
 * @dev An ERC-4626 compliant tokenized vault.
 * Integrates Chainlink Price Feeds to calculate the USD value of total assets.
 */
contract YieldVault is ERC4626 {
    AggregatorV3Interface public dataFeed;

    /**
     * @dev Constructor
     * @param _asset The underlying ERC20 asset (e.g. mUSDC)
     * @param _dataFeed The Chainlink price feed address
     */
    constructor(IERC20 _asset, address _dataFeed) 
        ERC4626(_asset) 
        ERC20("Yield Vault Shares", "yvUSDC") 
    {
        dataFeed = AggregatorV3Interface(_dataFeed);
    }

    /**
     * @dev Returns the latest price of the asset in USD.
     * Assumes the feed returns 8 decimals (standard for USD pairs).
     */
    function getLatestPrice() public view returns (int256) {
        (
            /* uint80 roundID */,
            int256 answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    /**
     * @dev Returns the total USD value of the vault's assets.
     * USD feeds have 8 decimals.
     * Formula: (totalAssets * price) / (10 ** assetDecimals)
     */
    function getTotalValueUSD() public view returns (uint256) {
        int256 price = getLatestPrice();
        if (price <= 0) return 0;
        
        uint256 assetDecimals = decimals(); // ERC4626 defaults to asset decimals
        return (totalAssets() * uint256(price)) / (10 ** assetDecimals);
    }
}
