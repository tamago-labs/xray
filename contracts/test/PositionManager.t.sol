// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import {PositionManager} from "../src/PositionManager.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {Types} from "../src/Types.sol";

interface IERC20Mock {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function mint(address to, uint256 amount) external;
    function decimals() external view returns (uint8);
}

contract PositionManagerTest is Test {
    PositionManager public manager;
    PriceOracle public oracle;
    IERC20Mock public collateral;

    address public trader = address(0x1);
    address public liquidator = address(0x2);

    uint256 constant PRICE = 500e18; // $500 per token
    uint256 constant STALENESS = 3600;
    uint256 constant UPDATE_DELAY = 300;

    // Margin rates
    uint256 constant INITIAL_MARGIN = 0.1e18;       // 10%
    uint256 constant MAINTENANCE_MARGIN = 0.05e18;  // 5%
    uint256 constant LIQUIDATION_PENALTY = 0.005e18; // 0.5%

    function setUp() public {
        oracle = new PriceOracle("Test", "TST", PRICE, STALENESS, UPDATE_DELAY);

        // Deploy mock collateral (6 decimals like USDC)
        collateral = IERC20Mock(address(new MockToken("USDC", "USDC", 6)));

        manager = new PositionManager(
            address(collateral),
            address(oracle),
            INITIAL_MARGIN,
            MAINTENANCE_MARGIN,
            LIQUIDATION_PENALTY
        );
    }

    function _mintCollateral(address to, uint256 amount) internal {
        IERC20Mock(address(collateral)).mint(to, amount);
    }

    function _approveCollateral(address owner, address spender, uint256 amount) internal {
        vm.prank(owner);
        IERC20Mock(address(collateral)).approve(spender, amount);
    }

    function _setPrice(uint256 newPrice) internal {
        uint256 currentTime = block.timestamp;
        vm.warp(currentTime + UPDATE_DELAY + 1);
        oracle.updatePrice(newPrice);
        vm.warp(currentTime + 2 * UPDATE_DELAY + 2);
        oracle.confirmPriceUpdate();
    }

    // ──────────────────────────── Deposit ───────────────────────────────

    function test_Deposit() public {
        _mintCollateral(trader, 1000e6);
        _approveCollateral(trader, address(manager), 1000e6);

        vm.prank(trader);
        manager.deposit(1000e6);

        Types.PositionData memory pos = manager.getPosition(trader);
        assertEq(pos.collateral, 1000e6);
        assertEq(collateral.balanceOf(address(manager)), 1000e6);
    }

    function test_RevertDepositZero() public {
        vm.prank(trader);
        vm.expectRevert(PositionManager.ZeroAmount.selector);
        manager.deposit(0);
    }

    // ──────────────────────────── Withdraw ──────────────────────────────

    function test_Withdraw() public {
        _mintCollateral(trader, 1000e6);
        _approveCollateral(trader, address(manager), 1000e6);

        vm.prank(trader);
        manager.deposit(1000e6);

        vm.prank(trader);
        manager.withdraw(400e6);

        Types.PositionData memory pos = manager.getPosition(trader);
        assertEq(pos.collateral, 600e6);
        assertEq(collateral.balanceOf(trader), 400e6);
    }

    function test_RevertWithdrawTooMuch() public {
        _mintCollateral(trader, 1000e6);
        _approveCollateral(trader, address(manager), 1000e6);

        vm.prank(trader);
        manager.deposit(500e6);

        vm.prank(trader);
        vm.expectRevert(PositionManager.InsufficientBalance.selector);
        manager.withdraw(600e6);
    }

    // ──────────────────────────── Open Position ─────────────────────────

    function test_OpenLongPosition() public {
        _mintCollateral(trader, 10000e6);
        _approveCollateral(trader, address(manager), 10000e6);

        vm.prank(trader);
        manager.deposit(1000e6);

        // Open LONG: size=1, price=500e18, required margin = 1 * 500e18 * 0.1 / 1e18 = 50
        vm.prank(trader);
        manager.openPosition(Types.Side.LONG, 1e18);

        Types.PositionData memory pos = manager.getPosition(trader);
        assertEq(uint256(pos.side), uint256(Types.Side.LONG));
        assertEq(pos.size, 1e18);
        assertEq(pos.entryValue, PRICE);
    }

    function test_RevertOpenPositionNoCollateral() public {
        vm.prank(trader);
        vm.expectRevert(PositionManager.InsufficientMargin.selector);
        manager.openPosition(Types.Side.LONG, 1e18);
    }

    function test_RevertOpenPositionFlat() public {
        vm.prank(trader);
        vm.expectRevert(PositionManager.WrongSide.selector);
        manager.openPosition(Types.Side.FLAT, 1e18);
    }

    function test_RevertOpenPositionAlreadyOpen() public {
        _mintCollateral(trader, 10000e6);
        _approveCollateral(trader, address(manager), 10000e6);

        vm.prank(trader);
        manager.deposit(1000e6);

        vm.prank(trader);
        manager.openPosition(Types.Side.LONG, 1e18);

        vm.prank(trader);
        vm.expectRevert(PositionManager.PositionExists.selector);
        manager.openPosition(Types.Side.SHORT, 1e18);
    }

    // ──────────────────────────── Close Position ────────────────────────

    function test_CloseLongProfit() public {
        _mintCollateral(trader, 10000e6);
        _approveCollateral(trader, address(manager), 10000e6);

        vm.prank(trader);
        manager.deposit(1000e6);

        vm.prank(trader);
        manager.openPosition(Types.Side.LONG, 1e18);

        // Price goes up to $600
        _setPrice(600e18);

        vm.prank(trader);
        manager.closePosition();

        Types.PositionData memory pos = manager.getPosition(trader);
        assertEq(uint256(pos.side), uint256(Types.Side.FLAT));
        assertEq(pos.size, 0);

        // Trader should have received collateral back (1000 USDC + profit)
        assertGt(collateral.balanceOf(trader), 0);
    }

    function test_CloseLongLoss() public {
        _mintCollateral(trader, 10000e6);
        _approveCollateral(trader, address(manager), 10000e6);

        vm.prank(trader);
        manager.deposit(1000e6);

        vm.prank(trader);
        manager.openPosition(Types.Side.LONG, 1e18);

        // Price drops to $400
        _setPrice(400e18);

        vm.prank(trader);
        manager.closePosition();

        Types.PositionData memory pos = manager.getPosition(trader);
        assertEq(uint256(pos.side), uint256(Types.Side.FLAT));
    }

    function test_RevertCloseNoPosition() public {
        vm.prank(trader);
        vm.expectRevert(PositionManager.NoPosition.selector);
        manager.closePosition();
    }

    // ──────────────────────────── Liquidation ───────────────────────────

    function test_Liquidate() public {
        _mintCollateral(trader, 10000e6);
        _approveCollateral(trader, address(manager), 10000e6);
        _mintCollateral(liquidator, 10000e6);

        vm.prank(trader);
        manager.deposit(100e6); // $100 collateral

        vm.prank(trader);
        manager.openPosition(Types.Side.LONG, 0.5e18); // size=0.5, notional=$250

        // Price drops to $400: PnL = 0.5 * (400-500) = -$50
        // Equity = 100 - 50 = $50, margin = 50/200 = 25% — still above 5%
        // Drop further to $200: PnL = 0.5 * (200-500) = -$150
        // Equity = 100 - 150 = -$50 — underwater!
        _setPrice(200e18);

        assertTrue(manager.isLiquidatable(trader));

        vm.prank(liquidator);
        manager.liquidate(trader);

        Types.PositionData memory pos = manager.getPosition(trader);
        assertEq(uint256(pos.side), uint256(Types.Side.FLAT));
        assertEq(pos.collateral, 0);
    }

    function test_RevertLiquidateHealthy() public {
        _mintCollateral(trader, 10000e6);
        _approveCollateral(trader, address(manager), 10000e6);

        vm.prank(trader);
        manager.deposit(1000e6);

        vm.prank(trader);
        manager.openPosition(Types.Side.LONG, 1e18);

        assertFalse(manager.isLiquidatable(trader));

        vm.prank(liquidator);
        vm.expectRevert(PositionManager.PositionHealthy.selector);
        manager.liquidate(trader);
    }

    // ──────────────────────────── Margin Ratio ──────────────────────────

    function test_GetMarginRatio() public {
        _mintCollateral(trader, 10000e6);
        _approveCollateral(trader, address(manager), 10000e6);

        vm.prank(trader);
        manager.deposit(100e6);

        // No position = max ratio
        assertEq(manager.getMarginRatio(trader), type(uint256).max);

        vm.prank(trader);
        manager.openPosition(Types.Side.LONG, 0.5e18);

        // Collateral=$100, size=0.5, price=$500, notional=$250
        // Margin = 100/250 = 40%
        uint256 ratio = manager.getMarginRatio(trader);
        assertGt(ratio, MAINTENANCE_MARGIN);
    }

    // ──────────────────────────── Is Liquidatable ───────────────────────

    function test_IsLiquidatable_False() public {
        _mintCollateral(trader, 10000e6);
        _approveCollateral(trader, address(manager), 10000e6);

        vm.prank(trader);
        manager.deposit(1000e6);

        vm.prank(trader);
        manager.openPosition(Types.Side.LONG, 1e18);

        assertFalse(manager.isLiquidatable(trader));
    }

    function test_IsLiquidatable_NoPosition() public {
        assertFalse(manager.isLiquidatable(trader));
    }
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
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
    }
}
