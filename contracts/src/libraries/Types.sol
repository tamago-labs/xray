// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Types
/// @notice Core data types for the Pre-IPO Perpetual DEX
library Types {
    /// @notice Position side
    /// @param FLAT No position
    /// @param LONG Long position (bullish on pre-IPO valuation)
    /// @param SHORT Short position (bearish on pre-IPO valuation)
    enum Side {
        FLAT,
        LONG,
        SHORT
    }

    /// @notice Market status
    /// @param NORMAL Trading active
    /// @param EMERGENCY Trading paused, only closures allowed
    /// @param SETTLED Market closed permanently
    enum Status {
        NORMAL,
        EMERGENCY,
        SETTLED
    }

    /// @notice Oracle source mode
    /// @param Fallback Admin-push price
    /// @param Chainlink Chainlink-style aggregator
    /// @param Pyth Pyth Network price feed
    enum OracleSource {
        Fallback,
        Chainlink,
        Pyth
    }

    /// @notice Position data struct
    struct PositionData {
        uint256 collateral;      // Amount of collateral deposited
        Side side;               // LONG or SHORT
        uint256 size;            // Position size in base units
        uint256 entryValue;      // Entry mark price (with premium)
        int256 socialLoss;       // Accumulated social loss
        int256 fundingLoss;      // Accumulated funding loss
    }

    /// @notice Funding state struct
    struct FundingState {
        uint256 lastUpdateTime;  // Last funding update timestamp
        int256 premium;          // Current premium (mark - spot)
        int256 emaPremium;       // EMA of premium
        int256 accumulatedFunding; // Total accumulated funding
    }

    /// @notice Market configuration
    struct MarketConfig {
        string name;             // e.g. "OpenAI Pre-IPO"
        string symbol;           // e.g. "preOPENAI"
        address collateralToken; // USDC/USDT
        address priceFeed;       // Oracle/aggregator address
        uint256 initialMargin;   // Initial margin rate (WAD)
        uint256 maintenanceMargin; // Maintenance margin rate (WAD)
        uint256 liquidationPenalty; // Liquidation penalty (WAD)
        uint256 fundingPeriod;   // Funding period in seconds
        uint256 premiumLimit;    // Max premium before capping
        uint256 dampener;        // Funding dampener band
    }
}
