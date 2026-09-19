// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

/// @dev The maximum fee a market can have (25%).
uint256 constant MAX_FEE = 0.25e18;

/// @dev Oracle price scale.
uint256 constant ORACLE_PRICE_SCALE = 1e36;

/// @dev Liquidation cursor.
uint256 constant LIQUIDATION_CURSOR = 0.3e18;

/// @dev Max liquidation incentive factor.
uint256 constant MAX_LIQUIDATION_INCENTIVE_FACTOR = 1.15e18;

/// @dev The EIP-712 typeHASH for EIP712Domain.
bytes32 constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(uint256 chainId,address verifyingContract)");

/// @dev The EIP-712 typeHASH for Authorization.
bytes32 constant AUTHORIZATION_TYPEHASH =
    keccak256("Authorization(address authorizer,address authorized,bool isAuthorized,uint256 nonce,uint256 deadline)");

// ──────────────────── Pre-IPO Perpetual DEX Constants ────────────────────

/// @dev WAD scale (1e18) for fixed-point math.
uint256 constant WAD = 1e18;

/// @dev Default initial margin rate: 10% (0.1e18).
uint256 constant DEFAULT_INITIAL_MARGIN = 0.1e18;

/// @dev Default maintenance margin rate: 5% (0.05e18).
uint256 constant DEFAULT_MAINTENANCE_MARGIN = 0.05e18;

/// @dev Default liquidation penalty: 0.5% (0.005e18).
uint256 constant DEFAULT_LIQUIDATION_PENALTY = 0.005e18;

/// @dev Default funding period: 8 hours (28800 seconds).
uint256 constant DEFAULT_FUNDING_PERIOD = 28800;

/// @dev Default funding dampener: 0.05% (0.0005e18).
uint256 constant DEFAULT_DAMPENER = 0.0005e18;

/// @dev Default premium limit: 0.5% (0.005e18).
uint256 constant DEFAULT_PREMIUM_LIMIT = 0.005e18;

/// @dev Default staleness threshold: 1 hour (3600 seconds).
uint256 constant DEFAULT_STALENESS_THRESHOLD = 3600;

/// @dev Max price deviation between updates: 50% (0.5e18).
uint256 constant MAX_PRICE_DEVIATION = 0.5e18;

/// @dev Minimum price update delay: 5 minutes (300 seconds).
uint256 constant MIN_PRICE_UPDATE_DELAY = 300;

/// @dev EMA alpha for funding: 2/(600+1) ≈ 0.00333 (20-min half-life).
uint256 constant EMA_ALPHA = 3333333333333333;

/// @dev Dev fee rate: 1% for makers and takers (0.01e18).
uint256 constant DEV_FEE_RATE = 0.01e18;
