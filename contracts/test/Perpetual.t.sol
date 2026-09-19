// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import {Perpetual} from "../src/Perpetual.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {Types} from "../src/libraries/Types.sol";

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

contract PerpetualTest is Test {
    Perpetual public perpetual;
    PriceOracle public oracle;
    IERC20Mock public collateral;

    address public trader = address(0x1);
    address public lp = address(0x2);

    uint256 constant PRICE = 500e18;
    uint256 constant STALENESS = 3600;
    uint256 constant UPDATE_DELAY = 300;

    uint256 constant INITIAL_MARGIN = 0.1e18;
    uint256 constant MAINTENANCE_MARGIN = 0.05e18;
    uint256 constant LIQUIDATION_PENALTY = 0.005e18;

    function setUp() public {
        oracle = new PriceOracle("Test", "TST", PRICE, STALENESS, UPDATE_DELAY);
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
    }

    function _mintAndApprove(address who, uint256 amount, address spender) internal {
        IERC20Mock(address(collateral)).mint(who, amount);
        vm.prank(who);
        IERC20Mock(address(collateral)).approve(spender, amount);
    }

    // ──────────────────────────── Constructor ───────────────────────────

    function test_Constructor() public {
        assertEq(perpetual.name(), "OpenAI Pre-IPO");
        assertEq(perpetual.symbol(), "preOPENAI");
        assertEq(uint256(perpetual.getStatus()), uint256(Types.Status.NORMAL));
        assertTrue(address(perpetual.amm()) != address(0));
    }

    // ──────────────────────────── Deposit ───────────────────────────────

    function test_Deposit() public {
        _mintAndApprove(trader, 10000e6, address(perpetual));

        vm.prank(trader);
        perpetual.deposit(1000e6);

        Types.PositionData memory pos = perpetual.getPosition(trader);
        assertEq(pos.collateral, 1000e6);
    }

    function test_Withdraw() public {
        _mintAndApprove(trader, 10000e6, address(perpetual));

        vm.prank(trader);
        perpetual.deposit(1000e6);

        vm.prank(trader);
        perpetual.withdraw(400e6);

        assertEq(perpetual.deposits(trader), 600e6);
    }

    // ──────────────────────────── Open Position ─────────────────────────

    function test_OpenLongPosition() public {
        address ammAddr = address(perpetual.amm());

        // LP mints and approves AMM for pool initialization
        IERC20Mock(address(collateral)).mint(lp, 100000e6);
        vm.prank(lp);
        IERC20Mock(address(collateral)).approve(ammAddr, 100000e6);

        // Initialize pool as LP (direct AMM call)
        vm.prank(lp);
        IPerpAMM(ammAddr).initializePool(100000e6);

        // Trader deposits via Perpetual
        IERC20Mock(address(collateral)).mint(trader, 100000e6);
        vm.prank(trader);
        IERC20Mock(address(collateral)).approve(address(perpetual), 100000e6);

        vm.prank(trader);
        perpetual.deposit(1000e6);

        // Open long (smaller size for testing)
        vm.prank(trader);
        perpetual.openPosition(Types.Side.LONG, 1e18);

        Types.PositionData memory pos = perpetual.getPosition(trader);
        assertEq(uint256(pos.side), uint256(Types.Side.LONG));
        assertEq(pos.size, 1e18);
        assertTrue(pos.entryValue > 0);
    }

    // ──────────────────────────── Status ────────────────────────────────

    function test_Emergency() public {
        perpetual.declareEmergency();
        assertEq(uint256(perpetual.getStatus()), uint256(Types.Status.EMERGENCY));
    }

    // ──────────────────────────── Views ─────────────────────────────────

    function test_GetPoolBalances() public {
        (uint256 margin, uint256 position) = perpetual.getPoolBalances();
        assertEq(margin, 0);
        assertEq(position, 0);
    }

    function test_GetMarkPrice() public {
        assertEq(perpetual.getMarkPrice(), PRICE);
    }

    function test_GetPremium() public {
        assertEq(perpetual.getPremium(), 0);
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
