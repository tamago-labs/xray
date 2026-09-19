// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import {FundingCalculator} from "../src/FundingCalculator.sol";
import {Types} from "../src/libraries/Types.sol";

interface IERC20Mock {
    function mint(address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
}

contract FundingCalculatorTest is Test {
    FundingCalculator public calculator;
    IERC20Mock public collateral;

    address public trader = address(0x1);

    int256 constant PREMIUM_LIMIT = 0.005e18;       // 0.5%
    int256 constant EMA_ALPHA = 3333333333333333;    // ~2/(600+1)
    int256 constant DAMPENER = 0.0005e18;             // 0.05%
    uint256 constant FUNDING_PERIOD = 28800;         // 8 hours

    function setUp() public {
        collateral = IERC20Mock(address(new MockToken("USDC", "USDC", 6)));

        calculator = new FundingCalculator(
            address(collateral),
            PREMIUM_LIMIT,
            EMA_ALPHA,
            DAMPENER,
            FUNDING_PERIOD
        );
    }

    // ──────────────────────────── Constructor ───────────────────────────

    function test_Constructor() public {
        assertEq(calculator.markPremiumLimit(), PREMIUM_LIMIT);
        assertEq(calculator.emaAlpha(), EMA_ALPHA);
        assertEq(calculator.fundingDampener(), DAMPENER);
        assertEq(calculator.fundingPeriod(), FUNDING_PERIOD);
    }

    // ──────────────────────────── Funding Rate ──────────────────────────

    function test_FundingRate_PositivePremium() public {
        Types.FundingState memory state;
        state.premium = 0.01e18;
        state.emaPremium = 0.01e18;
        calculator.setFundingState(state);

        int256 rate = calculator.getFundingRate();
        assertGt(rate, 0);
    }

    function test_FundingRate_NegativePremium() public {
        Types.FundingState memory state;
        state.premium = -0.01e18;
        state.emaPremium = -0.01e18;
        calculator.setFundingState(state);

        int256 rate = calculator.getFundingRate();
        assertLt(rate, 0);
    }

    function test_FundingRate_WithinDampener() public {
        Types.FundingState memory state;
        state.premium = 0.0001e18;
        state.emaPremium = 0.0001e18;
        calculator.setFundingState(state);

        int256 rate = calculator.getFundingRate();
        assertEq(rate, 0);
    }

    // ──────────────────────────── Accumulated Funding ───────────────────

    function test_AccumulatedFunding() public {
        Types.FundingState memory state;
        state.premium = 0.01e18;
        state.emaPremium = 0.01e18;
        calculator.setFundingState(state);

        vm.warp(block.timestamp + 3600);

        calculator.updateIndex();

        Types.FundingState memory funding = calculator.getFundingState();
        int256 accumulated = funding.accumulatedFunding;
        assertGt(accumulated, 0);
    }

    // ──────────────────────────── Update Index ──────────────────────────

    function test_RevertUpdateTimeZero() public {
        vm.expectRevert(FundingCalculator.IndexNotUpdated.selector);
        calculator.updateIndex();
    }

    // ──────────────────────────── Getters ───────────────────────────────

    function test_GetFundingState() public {
        Types.FundingState memory state = calculator.getFundingState();
        assertEq(state.premium, 0);
        assertEq(state.emaPremium, 0);
    }

    function test_GetAccumulatedFunding() public {
        assertEq(calculator.getAccumulatedFunding(trader), 0);
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
