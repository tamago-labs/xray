// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import {Perpetual} from "../src/Perpetual.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {FundingCalculator} from "../src/FundingCalculator.sol";
import {Types} from "../src/Types.sol";

interface IERC20Mock {
    function mint(address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

interface IPerpAMM {
    function initializePool(uint256 marginAmount) external;
    function addLiquidity(uint256 marginAmount) external;
    function removeLiquidity(uint256 shareAmount) external;
    function buy(uint256 size, uint256 maxPrice) external returns (uint256);
    function sell(uint256 size, uint256 minPrice) external returns (uint256);
    function getMarkPrice() external view returns (uint256);
    function getPremium() external view returns (int256);
    function getPoolBalances() external view returns (uint256, uint256);
    function lpToken() external view returns (address);
}

contract IntegrationTest is Test {
    Perpetual public perpetual;
    PriceOracle public oracle;
    IERC20Mock public collateral;
    FundingCalculator public funding;

    address public lp = address(0x1);
    address public trader = address(0x2);
    address public liquidator = address(0x3);

    uint256 constant INITIAL_PRICE = 500e18;
    uint256 constant STALENESS = 3600;
    uint256 constant UPDATE_DELAY = 300;
    uint256 constant LP_AMOUNT = 100000e6;
    uint256 constant TRADER_AMOUNT = 10000e6;

    uint256 constant INITIAL_MARGIN = 0.1e18;
    uint256 constant MAINTENANCE_MARGIN = 0.05e18;
    uint256 constant LIQUIDATION_PENALTY = 0.005e18;

    int256 constant PREMIUM_LIMIT = 0.005e18;
    int256 constant EMA_ALPHA = 3333333333333333;
    int256 constant DAMPENER = 0.0005e18;
    uint256 constant FUNDING_PERIOD = 28800;

    function setUp() public {
        oracle = new PriceOracle("Test", "TST", INITIAL_PRICE, STALENESS, UPDATE_DELAY);
        collateral = IERC20Mock(address(new MockToken("USDC", "USDC", 6)));

        perpetual = new Perpetual(
            "OpenAI Pre-IPO",
            "preOPENAI",
            address(collateral),
            address(oracle),
            INITIAL_MARGIN,
            MAINTENANCE_MARGIN,
            LIQUIDATION_PENALTY
        );

        funding = new FundingCalculator(
            address(collateral),
            PREMIUM_LIMIT,
            EMA_ALPHA,
            DAMPENER,
            FUNDING_PERIOD
        );
    }

    function _setPrice(uint256 newPrice) internal {
        uint256 currentTime = block.timestamp;
        vm.warp(currentTime + UPDATE_DELAY + 1);
        oracle.updatePrice(newPrice);
        vm.warp(currentTime + 2 * UPDATE_DELAY + 2);
        oracle.confirmPriceUpdate();
    }

    function _mintAndApprove(address who, uint256 amount, address spender) internal {
        IERC20Mock(address(collateral)).mint(who, amount);
        vm.prank(who);
        IERC20Mock(address(collateral)).approve(spender, amount);
    }

    // ──────────────────────────── Full Flow ─────────────────────────────

    function test_FullDepositWithdrawFlow() public {
        address ammAddr = address(perpetual.amm());

        _mintAndApprove(lp, LP_AMOUNT, ammAddr);
        vm.prank(lp);
        IPerpAMM(ammAddr).initializePool(LP_AMOUNT);

        _mintAndApprove(trader, TRADER_AMOUNT, address(perpetual));
        vm.prank(trader);
        perpetual.deposit(TRADER_AMOUNT);

        Types.PositionData memory pos = perpetual.getPosition(trader);
        assertEq(pos.collateral, TRADER_AMOUNT);

        vm.prank(trader);
        perpetual.withdraw(4000e6);

        assertEq(perpetual.deposits(trader), 6000e6);
    }

    function test_OpenAndCloseLongPosition() public {
        address ammAddr = address(perpetual.amm());

        _mintAndApprove(lp, LP_AMOUNT, ammAddr);
        vm.prank(lp);
        IPerpAMM(ammAddr).initializePool(LP_AMOUNT);

        _mintAndApprove(trader, TRADER_AMOUNT, address(perpetual));
        vm.prank(trader);
        perpetual.deposit(TRADER_AMOUNT);

        uint256 size = 5e18;

        vm.prank(trader);
        perpetual.openPosition(Types.Side.LONG, size);

        Types.PositionData memory pos = perpetual.getPosition(trader);
        assertEq(uint256(pos.side), uint256(Types.Side.LONG));
        assertEq(pos.size, size);
        assertTrue(pos.entryValue > 0);

        vm.prank(trader);
        perpetual.closePosition();

        pos = perpetual.getPosition(trader);
        assertEq(uint256(pos.side), uint256(Types.Side.FLAT));
        assertEq(pos.size, 0);
    }

    function test_PriceChangeAffectsPosition() public {
        address ammAddr = address(perpetual.amm());

        _mintAndApprove(lp, LP_AMOUNT, ammAddr);
        vm.prank(lp);
        IPerpAMM(ammAddr).initializePool(LP_AMOUNT);

        _mintAndApprove(trader, TRADER_AMOUNT, address(perpetual));
        vm.prank(trader);
        perpetual.deposit(TRADER_AMOUNT);

        uint256 size = 5e18;

        vm.prank(trader);
        perpetual.openPosition(Types.Side.LONG, size);

        Types.PositionData memory pos = perpetual.getPosition(trader);
        uint256 entryPrice = pos.entryValue;

        _setPrice(600e18);

        uint256 marginRatio = perpetual.getMarginRatio(trader);
        assertGt(marginRatio, 0);
    }

    function test_LiqudationFlow() public {
        address ammAddr = address(perpetual.amm());

        _mintAndApprove(lp, LP_AMOUNT, ammAddr);
        vm.prank(lp);
        IPerpAMM(ammAddr).initializePool(LP_AMOUNT);

        _mintAndApprove(trader, TRADER_AMOUNT, address(perpetual));
        _mintAndApprove(liquidator, TRADER_AMOUNT, address(perpetual));

        vm.prank(trader);
        perpetual.deposit(TRADER_AMOUNT);

        uint256 size = 10e18;

        vm.prank(trader);
        perpetual.openPosition(Types.Side.LONG, size);

        _setPrice(300e18);

        bool isLiquidatable = perpetual.isLiquidatable(trader);

        if (isLiquidatable) {
            vm.prank(liquidator);
            perpetual.liquidate(trader);

            Types.PositionData memory pos = perpetual.getPosition(trader);
            assertEq(uint256(pos.side), uint256(Types.Side.FLAT));
            assertEq(pos.collateral, 0);
        }
    }

    function test_LPAddAndRemoveLiquidity() public {
        address ammAddr = address(perpetual.amm());

        _mintAndApprove(lp, LP_AMOUNT, ammAddr);
        vm.prank(lp);
        IPerpAMM(ammAddr).initializePool(LP_AMOUNT);

        (uint256 margin, uint256 position) = perpetual.getPoolBalances();
        assertEq(margin, LP_AMOUNT);
        assertEq(position, 0);

        uint256 lpTokenBalance = IERC20Mock(perpetual.lpToken()).balanceOf(lp);
        assertGt(lpTokenBalance, 0);

        vm.prank(lp);
        IPerpAMM(ammAddr).removeLiquidity(lpTokenBalance);

        (margin, position) = perpetual.getPoolBalances();
        assertEq(margin, 0);
    }

    function test_FundingAccrual() public {
        Types.FundingState memory state;
        state.premium = 0.01e18;
        state.emaPremium = 0.01e18;
        funding.setFundingState(state);

        vm.warp(block.timestamp + 3600);
        funding.updateIndex();

        Types.FundingState memory updated = funding.getFundingState();
        assertGt(updated.accumulatedFunding, 0);
    }

    function test_MultipleTraders() public {
        address ammAddr = address(perpetual.amm());

        _mintAndApprove(lp, LP_AMOUNT, ammAddr);
        vm.prank(lp);
        IPerpAMM(ammAddr).initializePool(LP_AMOUNT);

        address trader2 = address(0x4);
        _mintAndApprove(trader, TRADER_AMOUNT, address(perpetual));
        _mintAndApprove(trader2, TRADER_AMOUNT, address(perpetual));

        vm.prank(trader);
        perpetual.deposit(TRADER_AMOUNT);

        vm.prank(trader2);
        perpetual.deposit(TRADER_AMOUNT);

        vm.prank(trader);
        perpetual.openPosition(Types.Side.LONG, 5e18);

        vm.prank(trader2);
        perpetual.openPosition(Types.Side.SHORT, 3e18);

        Types.PositionData memory pos1 = perpetual.getPosition(trader);
        Types.PositionData memory pos2 = perpetual.getPosition(trader2);

        assertEq(uint256(pos1.side), uint256(Types.Side.LONG));
        assertEq(uint256(pos2.side), uint256(Types.Side.SHORT));
    }

    function test_MarkPriceAfterTrades() public {
        address ammAddr = address(perpetual.amm());

        _mintAndApprove(lp, LP_AMOUNT, ammAddr);
        vm.prank(lp);
        IPerpAMM(ammAddr).initializePool(LP_AMOUNT);

        uint256 markBefore = perpetual.getMarkPrice();
        assertEq(markBefore, INITIAL_PRICE);

        _mintAndApprove(trader, TRADER_AMOUNT, address(perpetual));
        vm.prank(trader);
        perpetual.deposit(TRADER_AMOUNT);

        vm.prank(trader);
        perpetual.openPosition(Types.Side.LONG, 10e18);

        uint256 markAfter = perpetual.getMarkPrice();
        assertGt(markAfter, 0);
    }

    function test_EmergencyMode() public {
        _mintAndApprove(trader, TRADER_AMOUNT, address(perpetual));
        vm.prank(trader);
        perpetual.deposit(TRADER_AMOUNT);

        perpetual.declareEmergency();

        vm.prank(trader);
        vm.expectRevert(Perpetual.MarketNotNormal.selector);
        perpetual.deposit(100e6);
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
