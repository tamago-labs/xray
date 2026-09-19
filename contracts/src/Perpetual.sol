// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IPerpetual} from "./interfaces/IPerpetual.sol";
import {Types} from "./Types.sol";
import {PerpAMM} from "./PerpAMM.sol";
import {IERC20} from "./interfaces/IERC20.sol";
import {IPreIpoOracle} from "./interfaces/IPreIpoOracle.sol";
import {SafeTransferLib} from "./libraries/SafeTransferLib.sol";

interface IERC20Metadata {
    function decimals() external view returns (uint8);
}

contract Perpetual is IPerpetual {
    using SafeTransferLib for IERC20;

    error NotOwner();
    error InvalidConfig();
    error MarketNotNormal();
    error MarketSettled();

    IERC20 public immutable collateralToken;
    IPreIpoOracle public immutable oracle;
    PerpAMM public immutable amm;
    string public name;
    string public symbol;

    address public owner;
    Types.Status public status;

    mapping(address => Types.PositionData) public positions;
    mapping(address => uint256) public deposits;

    uint256 public initialMarginRate;
    uint256 public maintenanceMarginRate;
    uint256 public liquidationPenaltyRate;
    uint8 public immutable collateralDecimals;

    event Deposited(address indexed trader, uint256 amount);
    event Withdrawn(address indexed trader, uint256 amount);
    event PositionOpened(address indexed trader, Types.Side side, uint256 size, uint256 avgPrice);
    event PositionClosed(address indexed trader, int256 pnl);
    event Liquidated(address indexed trader, address indexed liquidator, uint256 penalty);
    event EmergencyDeclared();
    event Settled(uint256 settlementPrice);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyNormal() {
        if (status != Types.Status.NORMAL) revert MarketNotNormal();
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _collateralToken,
        address _oracle,
        uint256 _initialMarginRate,
        uint256 _maintenanceMarginRate,
        uint256 _liquidationPenaltyRate
    ) {
        if (_collateralToken == address(0) || _oracle == address(0)) revert InvalidConfig();
        name = _name;
        symbol = _symbol;
        collateralToken = IERC20(_collateralToken);
        oracle = IPreIpoOracle(_oracle);
        owner = msg.sender;
        status = Types.Status.NORMAL;
        initialMarginRate = _initialMarginRate;
        maintenanceMarginRate = _maintenanceMarginRate;
        liquidationPenaltyRate = _liquidationPenaltyRate;
        collateralDecimals = IERC20Metadata(_collateralToken).decimals();

        amm = new PerpAMM(
            _collateralToken,
            _oracle,
            string(abi.encodePacked("LP ", _name)),
            string(abi.encodePacked("lp", _symbol))
        );
    }

    function deposit(uint256 amount) external onlyNormal {
        if (amount == 0) revert InvalidConfig();

        deposits[msg.sender] += amount;
        positions[msg.sender].collateral += amount;

        SafeTransferLib.safeTransferFrom(collateralToken, msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external onlyNormal {
        if (amount == 0) revert InvalidConfig();
        if (deposits[msg.sender] < amount) revert InvalidConfig();

        Types.PositionData storage pos = positions[msg.sender];
        if (pos.side != Types.Side.FLAT) {
            uint256 required = _getRequiredMargin(pos);
            uint256 remaining = pos.collateral > amount ? pos.collateral - amount : 0;
            if (remaining < required) revert InvalidConfig();
        }

        deposits[msg.sender] -= amount;
        positions[msg.sender].collateral -= amount;

        SafeTransferLib.safeTransfer(collateralToken, msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function openPosition(Types.Side side, uint256 size) external onlyNormal {
        if (size == 0 || side == Types.Side.FLAT) revert InvalidConfig();

        Types.PositionData storage pos = positions[msg.sender];
        if (pos.side != Types.Side.FLAT) revert InvalidConfig();

        uint256 avgPrice;
        if (side == Types.Side.LONG) {
            uint256 maxCost = _toCollateralDecimals((size * oracle.getPrice() * 2) / 1e18);
            SafeTransferLib.safeTransferFrom(collateralToken, msg.sender, address(this), maxCost);
            IERC20(collateralToken).approve(address(amm), maxCost);
            avgPrice = amm.buy(size, type(uint256).max);
        } else {
            avgPrice = amm.sell(size, 0);
        }

        pos.side = side;
        pos.size = size;
        pos.entryValue = avgPrice;

        emit PositionOpened(msg.sender, side, size, avgPrice);
    }

    function closePosition() external onlyNormal {
        Types.PositionData storage pos = positions[msg.sender];
        if (pos.side == Types.Side.FLAT) revert InvalidConfig();

        uint256 currentPrice = oracle.getPrice();
        int256 pnl = _getPnL(pos, currentPrice);

        if (pnl >= 0) {
            pos.collateral += uint256(pnl);
            deposits[msg.sender] += uint256(pnl);
        } else {
            uint256 loss = uint256(-pnl);
            if (loss >= pos.collateral) {
                deposits[msg.sender] -= pos.collateral;
                pos.collateral = 0;
            } else {
                pos.collateral -= loss;
                deposits[msg.sender] -= loss;
            }
        }

        if (pos.side == Types.Side.LONG) {
            amm.sell(pos.size, 0);
        } else {
            amm.buy(pos.size, type(uint256).max);
        }

        emit PositionClosed(msg.sender, pnl);

        pos.side = Types.Side.FLAT;
        pos.size = 0;
        pos.entryValue = 0;
    }

    function liquidate(address trader) external onlyNormal {
        if (!isLiquidatable(trader)) revert InvalidConfig();

        Types.PositionData storage pos = positions[trader];
        uint256 currentPrice = oracle.getPrice();
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
        uint256 traderRefund = remainingCollateral - penalty;

        deposits[trader] = 0;

        pos.side = Types.Side.FLAT;
        pos.size = 0;
        pos.entryValue = 0;
        pos.collateral = 0;

        if (liquidationPenaltyRate > 0) {
            SafeTransferLib.safeTransfer(collateralToken, msg.sender, penalty);
        }

        if (traderRefund > 0) {
            SafeTransferLib.safeTransfer(collateralToken, trader, traderRefund);
        }

        emit Liquidated(trader, msg.sender, penalty);
    }

    function getPosition(address trader) external view returns (Types.PositionData memory) {
        return positions[trader];
    }

    function getStatus() external view returns (Types.Status) {
        return status;
    }

    function getMarginRatio(address trader) external view returns (uint256) {
        Types.PositionData memory pos = positions[trader];
        if (pos.side == Types.Side.FLAT) return type(uint256).max;

        uint256 currentPrice = oracle.getPrice();
        int256 pnl = _getPnL(pos, currentPrice);

        int256 equity = int256(pos.collateral) + pnl;
        if (equity <= 0) return 0;

        uint256 notional = (pos.size * currentPrice) / 1e18;
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

        uint256 notional = (pos.size * currentPrice) / 1e18;
        if (notional == 0) return false;
        uint256 marginRatio = (uint256(equity) * 1e18) / notional;

        return marginRatio < maintenanceMarginRate;
    }

    function getPoolBalances() external view returns (uint256 margin, uint256 position) {
        return amm.getPoolBalances();
    }

    function getMarkPrice() external view returns (uint256) {
        return amm.getMarkPrice();
    }

    function getPremium() external view returns (int256) {
        return amm.getPremium();
    }

    function lpToken() external view returns (address) {
        return amm.lpToken();
    }

    function declareEmergency() external onlyOwner {
        status = Types.Status.EMERGENCY;
        emit EmergencyDeclared();
    }

    function settle(uint256 settlementPrice) external onlyOwner {
        status = Types.Status.SETTLED;
        emit Settled(settlementPrice);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidConfig();
        owner = newOwner;
    }

    function _getRequiredMargin(Types.PositionData memory pos) internal view returns (uint256) {
        uint256 currentPrice = oracle.getPrice();
        return (pos.size * currentPrice * maintenanceMarginRate) / 1e36;
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

        if (collateralDecimals < 18) {
            return rawPnL18 / int256(10 ** (18 - collateralDecimals));
        }
        return rawPnL18;
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
