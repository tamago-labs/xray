// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Types} from "../Types.sol";

/// @title IPreIpoOracle
/// @notice Interface for the pre-IPO price oracle
/// @dev Push-based oracle supporting multiple price sources
interface IPreIpoOracle {
    /// @notice Get the current pre-IPO valuation price
    /// @return price The price in USD scaled by 1e18
    function getPrice() external view returns (uint256 price);

    /// @notice Get the current price with timestamp info
    /// @return price The price in USD scaled by 1e18
    /// @return timestamp When the price was last updated
    function getPriceWithTimestamp() external view returns (uint256 price, uint256 timestamp);

    /// @notice Get the active oracle source
    /// @return source The current oracle source mode
    function activeSource() external view returns (Types.OracleSource source);

    /// @notice Check if the current price is stale
    /// @return stale True if price exceeds staleness threshold
    function isStale() external view returns (bool stale);

    /// @notice Get the pending price (before confirmation)
    /// @return pendingPrice The price waiting to be confirmed
    function pendingPrice() external view returns (uint256 pendingPrice);
}
