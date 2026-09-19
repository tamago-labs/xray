// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Types} from "../Types.sol";

/// @title IPerpetual
/// @notice Interface for the Pre-IPO perpetual contract
interface IPerpetual {
    /// @notice Deposit collateral into the perpetual
    /// @param amount Amount of collateral to deposit
    function deposit(uint256 amount) external;

    /// @notice Withdraw collateral from the perpetual
    /// @param amount Amount of collateral to withdraw
    function withdraw(uint256 amount) external;

    /// @notice Get position data for a trader
    /// @param trader The trader address
    /// @return position The position data
    function getPosition(address trader) external view returns (Types.PositionData memory position);

    /// @notice Get the current market status
    /// @return status The market status
    function getStatus() external view returns (Types.Status status);
}
