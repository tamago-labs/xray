// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title IAMM
/// @notice Interface for the Pre-IPO AMM
interface IAMM {
    /// @notice Get the current mark price (with premium)
    /// @return markPrice The AMM mark price scaled by 1e18
    function getMarkPrice() external view returns (uint256 markPrice);

    /// @notice Get the current premium (markPrice - spotPrice)
    /// @return premium The premium scaled by 1e18 (can be negative)
    function getPremium() external view returns (int256 premium);

    /// @notice Calculate buy price for a given size
    /// @param size The position size to buy
    /// @return price The average price for the buy
    function getBuyPrice(uint256 size) external view returns (uint256 price);

    /// @notice Calculate sell price for a given size
    /// @param size The position size to sell
    /// @return price The average price for the sell
    function getSellPrice(uint256 size) external view returns (uint256 price);

    /// @notice Get pool balances
    /// @return margin Available margin in pool
    /// @return position Total position exposure
    function getPoolBalances() external view returns (uint256 margin, uint256 position);

    /// @notice Get LP share token address
    /// @return shareToken The LP share token contract
    function lpToken() external view returns (address);
}
