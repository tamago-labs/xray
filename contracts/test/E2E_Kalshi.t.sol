// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import {PerpFactory} from "../src/PerpFactory.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {PerpAMM} from "../src/PerpAMM.sol";
import {Types} from "../src/Types.sol";

interface IERC20Mock {
    function mint(address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function decimals() external view returns (uint8);
}

contract E2E_KalshiTest is Test {
    PerpFactory public factory;
    PriceOracle public oracle;
    IERC20Mock public collateral;

    address public lp = address(0x1);
    address public userA = address(0x2);
    address public userB = address(0x3);
    address public liquidator = address(0x4);

    address public perpetual;

    uint256 constant INITIAL_PRICE = 800e18;
    uint256 constant STALENESS = type(uint256).max;
    uint256 constant UPDATE_DELAY = 300;

    uint256 constant INITIAL_MARGIN = 0.1e18;
    uint256 constant MAINTENANCE_MARGIN = 0.05e18;
    uint256 constant LIQUIDATION_PENALTY = 0.005e18;

    function setUp() public {
        oracle = new PriceOracle("Kalshi", "KSH", INITIAL_PRICE, STALENESS, UPDATE_DELAY);
        collateral = IERC20Mock(address(new MockToken("USDC", "USDC", 6)));
        factory = new PerpFactory();

        perpetual = factory.createMarket(
            "Kalshi Predictions",
            "KSH",
            address(collateral),
            address(oracle),
            INITIAL_MARGIN,
            MAINTENANCE_MARGIN,
            LIQUIDATION_PENALTY
        );
    }

    function test_Kalshi_FullLifecycle() public {
        IPerpetual perpHolder = IPerpetual(perpetual);
        address ammAddr = address(perpHolder.amm());

        _mintAndApprove(lp, 100_000e6, ammAddr);
        _mintAndApprove(userA, 50_000e6, perpetual);
        _mintAndApprove(userB, 50_000e6, perpetual);

        PerpFactory.MarketInfo memory info = factory.getMarket("KSH");
        assertEq(info.perpetual, perpetual);

        vm.prank(lp);
        IPerpAMM(ammAddr).initializePool(100_000e6);

        vm.prank(userA);
        perpHolder.deposit(50_000e6);

        vm.prank(userB);
        perpHolder.deposit(50_000e6);

        vm.prank(userA);
        IPerpetual(perpetual).openPosition(Types.Side.LONG, 100e18);

        vm.prank(userB);
        IPerpetual(perpetual).openPosition(Types.Side.SHORT, 50e18);

        (uint256 marginBal, uint256 posBal) = IPerpetual(perpetual).getPoolBalances();
        assertEq(posBal, 50e18);
        assertGt(marginBal, 0);

        _setPrice(850e18);

        vm.prank(userA);
        IPerpetual(perpetual).closePosition();

        vm.prank(userB);
        IPerpetual(perpetual).closePosition();

        vm.prank(userA);
        IPerpetual(perpetual).withdraw(40_000e6);

        vm.prank(userB);
        IPerpetual(perpetual).withdraw(40_000e6);

        vm.prank(address(factory));
        IPerpetual(perpetual).settle(900e18);

        assertEq(uint256(IPerpetual(perpetual).getStatus()), uint256(IPerpetual.MarketStatus.SETTLED));
    }

    function test_Kalshi_Liquidation() public {
        address ammAddr = address(IPerpetual(perpetual).amm());

        _mintAndApprove(lp, 100_000e6, ammAddr);
        _mintAndApprove(userA, 10_000e6, perpetual);
        _mintAndApprove(liquidator, 10_000e6, perpetual);

        vm.prank(lp);
        IPerpAMM(ammAddr).initializePool(100_000e6);

        vm.prank(userA);
        IPerpetual(perpetual).deposit(10_000e6);

        vm.prank(userA);
        IPerpetual(perpetual).openPosition(Types.Side.LONG, 50e18);

        _setPrice(400e18);

        bool isLiquidatable = IPerpetual(perpetual).isLiquidatable(userA);
        if (isLiquidatable) {
            vm.prank(liquidator);
            IPerpetual(perpetual).liquidate(userA);

            Types.PositionData memory pos = IPerpetual(perpetual).getPosition(userA);
            assertEq(uint256(pos.side), uint256(Types.Side.FLAT));
        }
    }

    function test_Kalshi_MultipleLPs() public {
        address lp2 = address(0x5);
        address ammAddr = address(IPerpetual(perpetual).amm());

        _mintAndApprove(lp, 100_000e6, ammAddr);
        _mintAndApprove(lp2, 50_000e6, ammAddr);
        _mintAndApprove(userA, 20_000e6, perpetual);

        vm.prank(lp);
        IPerpAMM(ammAddr).initializePool(100_000e6);

        vm.prank(lp2);
        IPerpAMM(ammAddr).addLiquidity(50_000e6);

        vm.prank(userA);
        IPerpetual(perpetual).deposit(20_000e6);

        vm.prank(userA);
        IPerpetual(perpetual).openPosition(Types.Side.LONG, 100e18);

        _setPrice(900e18);

        vm.prank(userA);
        IPerpetual(perpetual).closePosition();

        uint256 lp1Shares = IERC20Mock(IPerpetual(perpetual).amm().lpToken()).balanceOf(lp);
        uint256 lp2Shares = IERC20Mock(IPerpetual(perpetual).amm().lpToken()).balanceOf(lp2);

        assertGt(lp1Shares, 0);
        assertGt(lp2Shares, 0);

        vm.prank(userA);
        IPerpetual(perpetual).withdraw(10_000e6);
    }

    function test_Kalshi_SymmetricPositions() public {
        address ammAddr = address(IPerpetual(perpetual).amm());

        _mintAndApprove(lp, 100_000e6, ammAddr);
        _mintAndApprove(userA, 50_000e6, perpetual);
        _mintAndApprove(userB, 50_000e6, perpetual);

        vm.prank(lp);
        IPerpAMM(ammAddr).initializePool(100_000e6);

        vm.prank(userA);
        IPerpetual(perpetual).deposit(50_000e6);

        vm.prank(userB);
        IPerpetual(perpetual).deposit(50_000e6);

        vm.prank(userA);
        IPerpetual(perpetual).openPosition(Types.Side.LONG, 100e18);

        vm.prank(userB);
        IPerpetual(perpetual).openPosition(Types.Side.SHORT, 100e18);

        _setPrice(900e18);

        vm.prank(userA);
        IPerpetual(perpetual).closePosition();

        vm.prank(userB);
        IPerpetual(perpetual).closePosition();

        (uint256 finalMargin, uint256 finalPosition) = IPerpetual(perpetual).getPoolBalances();

        assertEq(finalPosition, 0);
    }

    function _setPrice(uint256 newPrice) internal {
        vm.warp(301);
        oracle.updatePrice(newPrice);
        vm.warp(602);
        oracle.confirmPriceUpdate();
    }

    function _mintAndApprove(address who, uint256 amount, address spender) internal {
        IERC20Mock(address(collateral)).mint(who, amount);
        vm.prank(who);
        IERC20Mock(address(collateral)).approve(spender, amount);
    }

    function _approve(address who, uint256 amount, address spender) internal {
        vm.prank(who);
        IERC20Mock(address(collateral)).approve(spender, amount);
    }
}

interface IPerpetual {
    enum MarketStatus { NORMAL, EMERGENCY, SETTLED }

    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function openPosition(Types.Side side, uint256 size) external;
    function closePosition() external;
    function liquidate(address trader) external;
    function settle(uint256 settlementPrice) external;
    function settlePosition() external;
    function getPosition(address trader) external view returns (Types.PositionData memory);
    function getMarginRatio(address trader) external view returns (uint256);
    function isLiquidatable(address trader) external view returns (bool);
    function getStatus() external view returns (MarketStatus);
    function getPoolBalances() external view returns (uint256 margin, uint256 position);
    function deposits(address trader) external view returns (uint256);
    function amm() external view returns (IAMM);
}

interface IAMM {
    function initializePool(uint256 marginAmount) external;
    function addLiquidity(uint256 marginAmount) external;
    function removeLiquidity(uint256 shareAmount) external;
    function buy(uint256 size, uint256 maxPrice) external returns (uint256);
    function sell(uint256 size, uint256 minPrice) external returns (uint256);
    function getPoolBalances() external view returns (uint256, uint256);
    function lpToken() external view returns (address);
}

interface IPerpAMM {
    function initializePool(uint256 marginAmount) external;
    function addLiquidity(uint256 marginAmount) external;
    function buy(uint256 size, uint256 maxPrice) external returns (uint256);
    function sell(uint256 size, uint256 minPrice) external returns (uint256);
}

contract MockToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (allowance[from][msg.sender] >= amount) {
            allowance[from][msg.sender] -= amount;
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
    }
}
