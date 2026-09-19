// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IPositionManager} from "./interfaces/IPositionManager.sol";
import {IPreIpoOracle} from "./interfaces/IPreIpoOracle.sol";
import {IERC20} from "./interfaces/IERC20.sol";
import {Types} from "./Types.sol";
import {SafeTransferLib} from "./libraries/SafeTransferLib.sol";

interface IERC20Metadata {
    function decimals() external view returns (uint8);
}

/// @title PositionManager
/// @notice Manages collateral, positions, and liquidations for the Pre-IPO Perpetual DEX
/// @dev Uses oracle for pricing. AMM integration in Phase 4.
contract PositionManager is IPositionManager {
    using SafeTransferLib for IERC20;

    // ──────────────────────────── Custom Errors ────────────────────────
    error ZeroAmount();
    error ZeroAddress();
    error InsufficientBalance();
    error PositionExists();
    error NoPosition();
    error WrongSide();
    error InsufficientMargin();
    error PositionHealthy();
    error CollateralWouldBeUnsafe();
    error DeviationTooHigh();
    error OracleStale();
    error TransferFailed();
    error ZeroPrice();

    // ──────────────────────────── State ────────────────────────────────
    IERC20 public immutable collateralToken;
    IPreIpoOracle public immutable oracle;
    uint8 public immutable collateralDecimals;

    uint256 public initialMarginRate;
    uint256 public maintenanceMarginRate;
    uint256 public liquidationPenaltyRate;

    mapping(address => Types.PositionData) public positions;

    // ──────────────────────────── Events ────────────────────────────────
    event Deposited(address indexed trader, uint256 amount);
    event Withdrawn(address indexed trader, uint256 amount);
    event PositionOpened(address indexed trader, Types.Side side, uint256 size, uint256 entryPrice);
    event PositionClosed(address indexed trader, int256 pnl);
    event Liquidated(address indexed trader, address indexed liquidator, uint256 penalty);

    // ──────────────────────────── Constructor ───────────────────────────
    constructor(
        address _collateralToken,
        address _oracle,
        uint256 _initialMarginRate,
        uint256 _maintenanceMarginRate,
        uint256 _liquidationPenaltyRate
    ) {
        if (_collateralToken == address(0) || _oracle == address(0)) revert ZeroAddress();
        collateralToken = IERC20(_collateralToken);
        collateralDecimals = IERC20Metadata(_collateralToken).decimals();
        oracle = IPreIpoOracle(_oracle);
        initialMarginRate = _initialMarginRate;
        maintenanceMarginRate = _maintenanceMarginRate;
        liquidationPenaltyRate = _liquidationPenaltyRate;
    }

    // ──────────────────────────── Deposit ───────────────────────────────

    function deposit(uint256 amount) external {
        _depositFor(msg.sender, amount);
    }

    function depositFor(address trader, uint256 amount) external {
        _depositFor(trader, amount);
    }

    function _depositFor(address trader, uint256 amount) internal {
        if (amount == 0) revert ZeroAmount();

        positions[trader].collateral += amount;

        SafeTransferLib.safeTransferFrom(collateralToken, trader, address(this), amount);

        emit Deposited(trader, amount);
    }

    // ──────────────────────────── Withdraw ──────────────────────────────

    function withdraw(uint256 amount) external {
        _withdrawTo(msg.sender, amount);
    }

    function withdrawFor(address trader, uint256 amount) external {
        _withdrawTo(trader, amount);
    }

    function _withdrawTo(address trader, uint256 amount) internal {
        if (amount == 0) revert ZeroAmount();

        Types.PositionData storage pos = positions[trader];
        if (amount > pos.collateral) revert InsufficientBalance();

        uint256 remainingCollateral = pos.collateral - amount;

        if (pos.side != Types.Side.FLAT) {
            uint256 required = _getRequiredMargin(pos);
            if (remainingCollateral < required) revert CollateralWouldBeUnsafe();
        }

        pos.collateral = remainingCollateral;

        SafeTransferLib.safeTransfer(collateralToken, trader, amount);

        emit Withdrawn(trader, amount);
    }

    // ──────────────────────────── Open Position ─────────────────────────

    function openPosition(Types.Side side, uint256 size) external {
        if (side == Types.Side.FLAT) revert WrongSide();
        if (size == 0) revert ZeroAmount();

        Types.PositionData storage pos = positions[msg.sender];
        if (pos.side != Types.Side.FLAT) revert PositionExists();

        uint256 currentPrice = _getSafePrice();

        uint256 requiredMargin = _calcMargin(size, currentPrice, initialMarginRate);
        if (pos.collateral < requiredMargin) revert InsufficientMargin();

        pos.side = side;
        pos.size = size;
        pos.entryValue = currentPrice;

        emit PositionOpened(msg.sender, side, size, currentPrice);
    }

    // ──────────────────────────── Close Position ────────────────────────

    function closePosition() external {
        Types.PositionData storage pos = positions[msg.sender];
        if (pos.side == Types.Side.FLAT) revert NoPosition();

        uint256 currentPrice = _getSafePrice();
        int256 pnl = _getPnL(pos, currentPrice);

        if (pnl >= 0) {
            pos.collateral += uint256(pnl);
        } else {
            uint256 loss = uint256(-pnl);
            if (loss >= pos.collateral) {
                pos.collateral = 0;
            } else {
                pos.collateral -= loss;
            }
        }

        emit PositionClosed(msg.sender, pnl);

        pos.side = Types.Side.FLAT;
        pos.size = 0;
        pos.entryValue = 0;
    }

    // ──────────────────────────── Liquidate ─────────────────────────────

    function liquidate(address trader) external {
        if (!isLiquidatable(trader)) revert PositionHealthy();

        Types.PositionData storage pos = positions[trader];
        uint256 currentPrice = _getSafePrice();
        int256 pnl = _getPnL(pos, currentPrice);

        uint256 remainingCollateral;
        if (pnl >= 0) {
            remainingCollateral = pos.collateral + uint256(pnl);
        } else {
            uint256 loss = uint256(-pnl);
            remainingCollateral = loss >= pos.collateral ? 0 : pos.collateral - loss;
        }

        uint256 penalty = (remainingCollateral * liquidationPenaltyRate) / 1e18;
        if (penalty == 0 && remainingCollateral > 0) penalty = 1;
        uint256 liquidatorReward = penalty;
        uint256 traderRefund = remainingCollateral - penalty;

        pos.side = Types.Side.FLAT;
        pos.size = 0;
        pos.entryValue = 0;
        pos.collateral = 0;

        if (liquidatorReward > 0) {
            SafeTransferLib.safeTransfer(collateralToken, msg.sender, liquidatorReward);
        }

        if (traderRefund > 0) {
            SafeTransferLib.safeTransfer(collateralToken, trader, traderRefund);
        }

        emit Liquidated(trader, msg.sender, penalty);
    }

    // ──────────────────────────── View Functions ────────────────────────

    function getPosition(address trader) external view returns (Types.PositionData memory) {
        return positions[trader];
    }

    function getMarginRatio(address trader) external view returns (uint256) {
        Types.PositionData memory pos = positions[trader];
        if (pos.side == Types.Side.FLAT) return type(uint256).max;

        uint256 currentPrice = oracle.getPrice();
        int256 pnl = _getPnL(pos, currentPrice);

        int256 equity = int256(pos.collateral) + pnl;
        if (equity <= 0) return 0;

        // Notional in collateral decimals
        uint256 notional = _notional(pos.size, currentPrice);
        if (notional == 0) return type(uint256).max;
        return (uint256(equity) * 1e18) / notional;
    }

    function isLiquidatable(address trader) public view returns (bool) {
        Types.PositionData memory pos = positions[trader];
        if (pos.side == Types.Side.FLAT) return false;

        uint256 currentPrice = oracle.getPrice();
        int256 pnl = _getPnL(pos, currentPrice);

        int256 equity = int256(pos.collateral) + pnl;
        if (equity <= 0) return true;

        uint256 notional = _notional(pos.size, currentPrice);
        if (notional == 0) return false;
        uint256 marginRatio = (uint256(equity) * 1e18) / notional;

        return marginRatio < maintenanceMarginRate;
    }

    function _notional(uint256 size, uint256 price) internal view returns (uint256) {
        uint256 notional18 = (size * price) / 1e18;
        if (collateralDecimals < 18) {
            return notional18 / (10 ** (18 - collateralDecimals));
        } else if (collateralDecimals > 18) {
            return notional18 * (10 ** (collateralDecimals - 18));
        }
        return notional18;
    }

    // ──────────────────────────── Internal ──────────────────────────────

    function _getSafePrice() internal view returns (uint256) {
        if (oracle.isStale()) revert OracleStale();
        uint256 price = oracle.getPrice();
        if (price == 0) revert ZeroPrice();
        return price;
    }

    function _getPnL(Types.PositionData memory pos, uint256 currentPrice) internal view returns (int256) {
        if (pos.side == Types.Side.FLAT) return 0;

        int256 priceDiff = int256(currentPrice) - int256(pos.entryValue);
        int256 rawPnL18;
        if (pos.side == Types.Side.LONG) {
            rawPnL18 = (int256(pos.size) * priceDiff) / int256(1e18);
        } else {
            rawPnL18 = (int256(pos.size) * (-priceDiff)) / int256(1e18);
        }

        // Convert from 18 decimals to collateral decimals
        if (collateralDecimals < 18) {
            return rawPnL18 / int256(10 ** (18 - collateralDecimals));
        } else if (collateralDecimals > 18) {
            return rawPnL18 * int256(10 ** (collateralDecimals - 18));
        }
        return rawPnL18;
    }

    function _getRequiredMargin(Types.PositionData memory pos) internal view returns (uint256) {
        uint256 currentPrice = oracle.getPrice();
        return _calcMargin(pos.size, currentPrice, maintenanceMarginRate);
    }

    function _calcMargin(uint256 size, uint256 price, uint256 marginRate) internal view returns (uint256) {
        // Result in 18 decimals, then convert to collateral decimals
        uint256 margin18 = (size * price * marginRate) / 1e36;
        if (collateralDecimals < 18) {
            return margin18 / (10 ** (18 - collateralDecimals));
        } else if (collateralDecimals > 18) {
            return margin18 * (10 ** (collateralDecimals - 18));
        }
        return margin18;
    }
}
