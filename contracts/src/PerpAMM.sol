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
    error SlippageExceeded();
    error PoolNotInitialized();

    IERC20 public immutable collateralToken;
    IPreIpoOracle public immutable oracle;
    uint8 public immutable collateralDecimals;
    uint256 public immutable DECIMAL_SCALE;
    LpShareToken public immutable lpShareToken;

    uint256 public marginBalance;
    uint256 public positionBalance;

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
        DECIMAL_SCALE = collateralDecimals < 18
            ? 10 ** (18 - collateralDecimals)
            : (collateralDecimals > 18 ? 10 ** (collateralDecimals - 18) : 1);
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

    /// @notice Adds liquidity to an existing pool. Mints LP shares proportional to deposit.
    function addLiquidity(uint256 marginAmount) external {
        if (marginAmount == 0) revert ZeroAmount();
        if (marginBalance == 0) revert PoolNotInitialized();

        SafeTransferLib.safeTransferFrom(collateralToken, msg.sender, address(this), marginAmount);

        marginBalance += marginAmount;

        uint256 shares = _mintShares(msg.sender, marginAmount);

        emit LiquidityAdded(msg.sender, marginAmount, shares);
    }

    /// @notice Burns LP shares and returns proportional collateral to the LP.
    function removeLiquidity(uint256 shareAmount) external {
        if (shareAmount == 0) revert ZeroAmount();

        uint256 totalShares = lpShareToken.totalSupply();
        if (shareAmount > totalShares) revert InsufficientLiquidity();

        uint256 marginToReturn = (shareAmount * marginBalance) / totalShares;

        if (marginToReturn > marginBalance) revert InsufficientLiquidity();

        lpShareToken.burn(msg.sender, shareAmount);
        marginBalance -= marginToReturn;

        SafeTransferLib.safeTransfer(collateralToken, msg.sender, marginToReturn);

        emit LiquidityRemoved(msg.sender, marginToReturn, shareAmount);
    }

    /// @notice Buys from the pool (trader goes long). Pays collateral, receives position exposure.
    function buy(uint256 size, uint256 maxPrice) external returns (uint256 avgPrice) {
        if (size == 0) revert ZeroAmount();

        avgPrice = getBuyPrice(size);
        if (avgPrice > maxPrice) revert SlippageExceeded();

        uint256 marginCost18 = (size * avgPrice) / 1e18;
        uint256 marginCost = collateralDecimals < 18
            ? marginCost18 / (10 ** (18 - collateralDecimals))
            : (collateralDecimals > 18 ? marginCost18 * (10 ** (collateralDecimals - 18)) : marginCost18);

        marginBalance += marginCost;
        positionBalance += size;

        SafeTransferLib.safeTransferFrom(collateralToken, msg.sender, address(this), marginCost);

        emit Bought(msg.sender, size, avgPrice, marginCost);

        return avgPrice;
    }

    /// @notice Sells to the pool (trader goes short). Returns collateral, gains short exposure.
    function sell(uint256 size, uint256 minPrice) external returns (uint256 avgPrice) {
        if (size == 0) revert ZeroAmount();

        avgPrice = getSellPrice(size);
        if (avgPrice < minPrice) revert SlippageExceeded();

        uint256 marginRefund18 = (size * avgPrice) / 1e18;
        uint256 marginRefund = collateralDecimals < 18
            ? marginRefund18 / (10 ** (18 - collateralDecimals))
            : (collateralDecimals > 18 ? marginRefund18 * (10 ** (collateralDecimals - 18)) : marginRefund18);

        if (positionBalance < size) revert InsufficientLiquidity();

        marginBalance -= marginRefund;
        positionBalance -= size;

        SafeTransferLib.safeTransfer(collateralToken, msg.sender, marginRefund);

        emit Sold(msg.sender, size, avgPrice, marginRefund);

        return avgPrice;
    }

    /// @notice Mark price = margin / position. Falls back to oracle when pool is empty.
    function getMarkPrice() public view returns (uint256) {
        if (positionBalance == 0 || marginBalance == 0) return oracle.getPrice();
        return (marginBalance * 1e18) / positionBalance;
    }

    /// @notice Premium = mark price minus oracle spot price.
    function getPremium() external view returns (int256) {
        uint256 mark = getMarkPrice();
        uint256 spot = oracle.getPrice();
        return int256(mark) - int256(spot);
    }

    /// @notice Buy price = oracle price + utilization premium. Rises as pool gets longer.
    function getBuyPrice(uint256 size) public view returns (uint256) {
        if (size == 0) return oracle.getPrice();
        if (marginBalance == 0) return oracle.getPrice();
        uint256 utilization = positionBalance > 0 ? (positionBalance * 1e18) / marginBalance : 0;
        uint256 premium = utilization * 100 / 1e18; // 1% per 100% utilization
        uint256 price = oracle.getPrice() + (oracle.getPrice() * premium) / 1e18;
        if (price == 0) return oracle.getPrice();
        return price;
    }

    /// @notice Sell price = oracle price - utilization discount. Falls as pool gets shorter.
    function getSellPrice(uint256 size) public view returns (uint256) {
        if (size == 0) return oracle.getPrice();
        if (marginBalance == 0) return oracle.getPrice();
        // Price decreases with pool utilization: price = oraclePrice * (1 - position/margin * 0.5)
        uint256 utilization = positionBalance > 0 ? (positionBalance * 1e18) / marginBalance : 0;
        uint256 discount = utilization * 50 / 1e18; // 0.5% per 100% utilization
        if (discount >= 1e18) return oracle.getPrice() / 2;
        uint256 price = oracle.getPrice() - (oracle.getPrice() * discount) / 1e18;
        return price;
    }

    function getPoolBalances() external view returns (uint256 margin, uint256 position) {
        return (marginBalance, positionBalance);
    }

    function lpToken() external view returns (address) {
        return address(lpShareToken);
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
}
