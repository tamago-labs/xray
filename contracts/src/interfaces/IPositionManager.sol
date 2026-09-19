// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Types} from "../libraries/Types.sol";

/// @title IPositionManager
/// @notice Interface for position management
interface IPositionManager {
    /// @notice Open a position
    /// @param side LONG or SHORT
    /// @param size Position size
    function openPosition(Types.Side side, uint256 size) external;

    /// @notice Close an existing position
    function closePosition() external;

    /// @notice Liquidate an undercollateralized position
    /// @param trader The trader to liquidate
    function liquidate(address trader) external;

    /// @notice Get the margin ratio for a trader
    /// @param trader The trader address
    /// @return ratio The margin ratio in WAD (1e18 = 100%)
    function getMarginRatio(address trader) external view returns (uint256 ratio);

    /// @notice Check if a position is liquidatable
    /// @param trader The trader address
    /// @return liquidatable True if position can be liquidated
    function isLiquidatable(address trader) external view returns (bool liquidatable);
}
