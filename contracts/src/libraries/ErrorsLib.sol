// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

/// @title ErrorsLib
/// @author Morpho Labs
/// @custom:contact security@morpho.org
/// @notice Library exposing error messages.
library ErrorsLib {
    /// @notice Thrown when the caller is not the owner.
    string internal constant NOT_OWNER = "not owner";

    /// @notice Thrown when the LLTV to enable exceeds the maximum LLTV.
    string internal constant MAX_LLTV_EXCEEDED = "max LLTV exceeded";

    /// @notice Thrown when the fee to set exceeds the maximum fee.
    string internal constant MAX_FEE_EXCEEDED = "max fee exceeded";

    /// @notice Thrown when the value is already set.
    string internal constant ALREADY_SET = "already set";

    /// @notice Thrown when the IRM is not enabled at market creation.
    string internal constant IRM_NOT_ENABLED = "IRM not enabled";

    /// @notice Thrown when the LLTV is not enabled at market creation.
    string internal constant LLTV_NOT_ENABLED = "LLTV not enabled";

    /// @notice Thrown when the market is already created.
    string internal constant MARKET_ALREADY_CREATED = "market already created";

    /// @notice Thrown when a token to transfer doesn't have code.
    string internal constant NO_CODE = "no code";

    /// @notice Thrown when the market is not created.
    string internal constant MARKET_NOT_CREATED = "market not created";

    /// @notice Thrown when not exactly one of the input amounts is zero.
    string internal constant INCONSISTENT_INPUT = "inconsistent input";

    /// @notice Thrown when zero assets is passed as input.
    string internal constant ZERO_ASSETS = "zero assets";

    /// @notice Thrown when a zero address is passed as input.
    string internal constant ZERO_ADDRESS = "zero address";

    /// @notice Thrown when the caller is not authorized to conduct an action.
    string internal constant UNAUTHORIZED = "unauthorized";

    /// @notice Thrown when the collateral is insufficient to `borrow` or `withdrawCollateral`.
    string internal constant INSUFFICIENT_COLLATERAL = "insufficient collateral";

    /// @notice Thrown when the liquidity is insufficient to `withdraw` or `borrow`.
    string internal constant INSUFFICIENT_LIQUIDITY = "insufficient liquidity";

    /// @notice Thrown when the position to liquidate is healthy.
    string internal constant HEALTHY_POSITION = "position is healthy";

    /// @notice Thrown when the authorization signature is invalid.
    string internal constant INVALID_SIGNATURE = "invalid signature";

    /// @notice Thrown when the authorization signature is expired.
    string internal constant SIGNATURE_EXPIRED = "signature expired";

    /// @notice Thrown when the nonce is invalid.
    string internal constant INVALID_NONCE = "invalid nonce";

    /// @notice Thrown when a token transfer reverted.
    string internal constant TRANSFER_REVERTED = "transfer reverted";

    /// @notice Thrown when a token transfer returned false.
    string internal constant TRANSFER_RETURNED_FALSE = "transfer returned false";

    /// @notice Thrown when a token transferFrom reverted.
    string internal constant TRANSFER_FROM_REVERTED = "transferFrom reverted";

    /// @notice Thrown when a token transferFrom returned false
    string internal constant TRANSFER_FROM_RETURNED_FALSE = "transferFrom returned false";

    /// @notice Thrown when the maximum uint128 is exceeded.
    string internal constant MAX_UINT128_EXCEEDED = "max uint128 exceeded";

    // ──────────────────── Pre-IPO Perpetual DEX Errors ────────────────────

    /// @notice Thrown when the caller is not whitelisted for an action.
    string internal constant NOT_WHITELISTED = "not whitelisted";

    /// @notice Thrown when the market is not in NORMAL status.
    string internal constant MARKET_NOT_NORMAL = "market not normal";

    /// @notice Thrown when the market is in EMERGENCY status.
    string internal constant MARKET_EMERGENCY = "market in emergency";

    /// @notice Thrown when the market is already settled.
    string internal constant MARKET_SETTLED = "market settled";

    /// @notice Thrown when position size is zero.
    string internal constant ZERO_SIZE = "zero size";

    /// @notice Thrown when collateral amount is zero.
    string internal constant ZERO_COLLATERAL = "zero collateral";

    /// @notice Thrown when the position is already in the requested side.
    string internal constant ALREADY_SAME_SIDE = "already same side";

    /// @notice Thrown when the position is healthy (cannot liquidate).
    string internal constant POSITION_HEALTHY = "position healthy";

    /// @notice Thrown when the oracle price is stale.
    string internal constant PRICE_STALE = "price stale";

    /// @notice Thrown when the oracle price is zero.
    string internal constant PRICE_ZERO = "price zero";

    /// @notice Thrown when the price update is too frequent.
    string internal constant UPDATE_TOO_FREQUENT = "update too frequent";

    /// @notice Thrown when the price deviation is too high.
    string internal constant PRICE_DEVIATION_HIGH = "price deviation too high";

    /// @notice Thrown when the oracle source is invalid.
    string internal constant INVALID_ORACLE_SOURCE = "invalid oracle source";

    /// @notice Thrown when no pending price update exists.
    string internal constant NO_PENDING_UPDATE = "no pending update";

    /// @notice Thrown when the pool has insufficient liquidity.
    string internal constant INSUFFICIENT_POOL_LIQUIDITY = "insufficient pool liquidity";

    /// @notice Thrown when the collateral is insufficient for the action.
    string internal constant INSUFFICIENT_COLLATERAL_AMOUNT = "insufficient collateral";

    /// @notice Thrown when the withdrawal would make position undercollateralized.
    string internal constant WITHDRAWAL_UNSAFE = "withdrawal unsafe";
}
