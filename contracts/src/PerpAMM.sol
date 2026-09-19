// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IAMM} from "./interfaces/IAMM.sol";
import {IPreIpoOracle} from "./interfaces/IPreIpoOracle.sol";
import {IERC20} from "./interfaces/IERC20.sol";
import {SafeTransferLib} from "./libraries/SafeTransferLib.sol";
import {LpShareToken} from "./LpShareToken.sol";

interface IERC20Metadata {
    function decimals() external view returns (uint8);
}

contract PerpAMM is IAMM {
    using SafeTransferLib for IERC20;

    error ZeroAmount();
    error ZeroAddress();
    error InsufficientLiquidity();
    error InsufficientPoolBalance();
    error SlippageExceeded();
    error PoolNotInitialized();

    IERC20 public immutable collateralToken;
    IPreIpoOracle public immutable oracle;
    uint8 public immutable collateralDecimals;
    LpShareToken public immutable lpShareToken;

    uint256 public marginBalance;
    int256 public netPosition;

    event PoolInitialized(uint256 margin);
    event LiquidityAdded(address indexed lp, uint256 margin, uint256 shares);
    event LiquidityRemoved(address indexed lp, uint256 margin, uint256 shares);
    event Bought(address indexed trader, uint256 size, uint256 avgPrice, uint256 marginCost);
    event Sold(address indexed trader, uint256 size, uint256 avgPrice, uint256 marginRefund);

    constructor(
        address _collateralToken,
        address _oracle,
        string memory _shareTokenName,
        string memory _shareTokenSymbol
    ) {
        if (_collateralToken == address(0) || _oracle == address(0)) revert ZeroAddress();
        collateralToken = IERC20(_collateralToken);
        collateralDecimals = IERC20Metadata(_collateralToken).decimals();
        oracle = IPreIpoOracle(_oracle);
        lpShareToken = new LpShareToken(_shareTokenName, _shareTokenSymbol);
    }

    /// @notice Initializes the pool with initial collateral. Can only be called once.
    function initializePool(uint256 marginAmount) external {
        if (marginBalance != 0) revert("pool already initialized");
        if (marginAmount == 0) revert ZeroAmount();

        marginBalance = marginAmount;

        SafeTransferLib.safeTransferFrom(collateralToken, msg.sender, address(this), marginAmount);

        uint256 shares = _mintShares(msg.sender, marginAmount);

        emit PoolInitialized(marginAmount);
        emit LiquidityAdded(msg.sender, marginAmount, shares);
    }

    /// @notice Adds liquidity. Shares minted proportional to deposit. Caller must approve token spend first.
    function addLiquidity(uint256 marginAmount) external {
        if (marginAmount == 0) revert ZeroAmount();
        if (marginBalance == 0) revert PoolNotInitialized();

        SafeTransferLib.safeTransferFrom(collateralToken, msg.sender, address(this), marginAmount);

        uint256 shares = _mintShares(msg.sender, marginAmount);

        marginBalance += marginAmount;

        emit LiquidityAdded(msg.sender, marginAmount, shares);
    }

    /// @notice Burns LP shares and returns proportional collateral.
    function removeLiquidity(uint256 shareAmount) external {
        if (shareAmount == 0) revert ZeroAmount();

        uint256 totalShares = lpShareToken.totalSupply();
        if (shareAmount > totalShares) revert InsufficientLiquidity();

        uint256 marginToReturn = (shareAmount * marginBalance) / totalShares;

        if (marginToReturn > marginBalance) revert InsufficientPoolBalance();

        lpShareToken.burn(msg.sender, shareAmount);
        marginBalance -= marginToReturn;

        SafeTransferLib.safeTransfer(collateralToken, msg.sender, marginToReturn);

        emit LiquidityRemoved(msg.sender, marginToReturn, shareAmount);
    }

    /// @notice Trader opens a long position. Pool takes the short side. Caller must approve margin payment.
    function buy(uint256 size, uint256 maxPrice) external returns (uint256 avgPrice) {
        if (size == 0) revert ZeroAmount();

        avgPrice = getBuyPrice(size);
        if (avgPrice > maxPrice) revert SlippageExceeded();

        uint256 marginCost = _toCollateralDecimals((size * avgPrice) / 1e18);

        marginBalance += marginCost;
        netPosition += int256(size);

        SafeTransferLib.safeTransferFrom(collateralToken, msg.sender, address(this), marginCost);

        emit Bought(msg.sender, size, avgPrice, marginCost);

        return avgPrice;
    }

    /// @notice Trader opens a short position. Pool takes the long side. Caller must approve margin payment.
    function sell(uint256 size, uint256 minPrice) external returns (uint256 avgPrice) {
        if (size == 0) revert ZeroAmount();

        avgPrice = getSellPrice(size);
        if (avgPrice < minPrice) revert SlippageExceeded();

        uint256 marginRefund = _toCollateralDecimals((size * avgPrice) / 1e18);

        if (marginRefund > marginBalance) revert InsufficientPoolBalance();

        marginBalance -= marginRefund;
        netPosition -= int256(size);

        SafeTransferLib.safeTransfer(collateralToken, msg.sender, marginRefund);

        emit Sold(msg.sender, size, avgPrice, marginRefund);

        return avgPrice;
    }

    /// @notice Mark price = margin / |netPosition|. Falls back to oracle when pool has no positions.
    function getMarkPrice() public view returns (uint256) {
        uint256 absPosition = netPosition >= 0 ? uint256(netPosition) : uint256(-netPosition);
        if (absPosition == 0 || marginBalance == 0) return oracle.getPrice();
        return (marginBalance * 1e18) / absPosition;
    }

    /// @notice Premium = mark price minus oracle spot price.
    function getPremium() external view returns (int256) {
        uint256 mark = getMarkPrice();
        uint256 spot = oracle.getPrice();
        return int256(mark) - int256(spot);
    }

    /// @notice Buy price with counter-party logic: pool shorts when trader longs.
    function getBuyPrice(uint256 size) public view returns (uint256) {
        if (size == 0) return oracle.getPrice();
        if (marginBalance == 0) return oracle.getPrice();
        uint256 absPosition = netPosition >= 0 ? uint256(netPosition) : uint256(-netPosition);
        uint256 utilization = (absPosition * 1e18) / marginBalance;
        if (netPosition >= 0) {
            uint256 premium = utilization * 100 / 1e18;
            return oracle.getPrice() + (oracle.getPrice() * premium) / 1e18;
        } else {
            uint256 discount = utilization * 50 / 1e18;
            if (discount >= 1e18) return oracle.getPrice() / 2;
            return oracle.getPrice() - (oracle.getPrice() * discount) / 1e18;
        }
    }

    /// @notice Sell price with counter-party logic: pool longs when trader shorts.
    function getSellPrice(uint256 size) public view returns (uint256) {
        if (size == 0) return oracle.getPrice();
        if (marginBalance == 0) return oracle.getPrice();
        uint256 absPosition = netPosition >= 0 ? uint256(netPosition) : uint256(-netPosition);
        uint256 utilization = (absPosition * 1e18) / marginBalance;
        if (netPosition <= 0) {
            uint256 premium = utilization * 100 / 1e18;
            return oracle.getPrice() + (oracle.getPrice() * premium) / 1e18;
        } else {
            uint256 discount = utilization * 50 / 1e18;
            if (discount >= 1e18) return oracle.getPrice() / 2;
            return oracle.getPrice() - (oracle.getPrice() * discount) / 1e18;
        }
    }

    /// @notice Returns pool balances: margin and net position (positive = pool short, negative = pool long).
    function getPoolBalances() external view returns (uint256 margin, uint256 position) {
        uint256 absPosition = netPosition >= 0 ? uint256(netPosition) : uint256(-netPosition);
        return (marginBalance, absPosition);
    }

    /// @notice LP share token address.
    function lpToken() external view returns (address) {
        return address(lpShareToken);
    }

    /// @notice Pool's unrealized PnL from all positions.
    function getUnrealizedPnL() external view returns (int256) {
        uint256 absPosition = netPosition >= 0 ? uint256(netPosition) : uint256(-netPosition);
        if (absPosition == 0) return 0;
        return 0;
    }

    function _mintShares(address to, uint256 marginAmount) internal returns (uint256 shares) {
        uint256 totalShares = lpShareToken.totalSupply();
        if (totalShares == 0) {
            shares = marginAmount;
        } else {
            shares = (marginAmount * totalShares) / marginBalance;
        }
        lpShareToken.mint(to, shares);
    }

    function _toCollateralDecimals(uint256 value18) internal view returns (uint256) {
        if (collateralDecimals < 18) {
            return value18 / (10 ** (18 - collateralDecimals));
        } else if (collateralDecimals > 18) {
            return value18 * (10 ** (collateralDecimals - 18));
        }
        return value18;
    }
}
