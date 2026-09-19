// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import {PerpFactory} from "../src/PerpFactory.sol";
import {PriceOracle} from "../src/PriceOracle.sol";

interface IERC20Mock {
    function mint(address to, uint256 amount) external;
    function approve(address spender, uint256 value) external returns (bool);
}

contract PerpFactoryTest is Test {
    PerpFactory public factory;
    PriceOracle public oracle;
    IERC20Mock public collateral;

    uint256 constant PRICE = 500e18;
    uint256 constant STALENESS = 3600;
    uint256 constant UPDATE_DELAY = 300;

    uint256 constant INITIAL_MARGIN = 0.1e18;
    uint256 constant MAINTENANCE_MARGIN = 0.05e18;
    uint256 constant LIQUIDATION_PENALTY = 0.005e18;

    function setUp() public {
        oracle = new PriceOracle("Test", "TST", PRICE, STALENESS, UPDATE_DELAY);
        collateral = IERC20Mock(address(new MockToken("USDC", "USDC", 6)));
        factory = new PerpFactory();
    }

    function test_CreateMarket() public {
        address perpetual = factory.createMarket(
            "OpenAI Pre-IPO",
            "preOPENAI",
            address(collateral),
            address(oracle),
            INITIAL_MARGIN,
            MAINTENANCE_MARGIN,
            LIQUIDATION_PENALTY
        );

        assertTrue(perpetual != address(0));
        assertTrue(factory.isMarket(perpetual));
        assertEq(factory.getMarketCount(), 1);
    }

    function test_GetMarket() public {
        address perpetual = factory.createMarket(
            "SpaceX Pre-IPO",
            "preSPACEX",
            address(collateral),
            address(oracle),
            INITIAL_MARGIN,
            MAINTENANCE_MARGIN,
            LIQUIDATION_PENALTY
        );

        PerpFactory.MarketInfo memory info = factory.getMarket("preSPACEX");
        assertEq(info.perpetual, perpetual);
        assertEq(info.symbol, "preSPACEX");
        assertEq(info.name, "SpaceX Pre-IPO");
    }

    function test_MultipleMarkets() public {
        factory.createMarket(
            "OpenAI Pre-IPO",
            "preOPENAI",
            address(collateral),
            address(oracle),
            INITIAL_MARGIN,
            MAINTENANCE_MARGIN,
            LIQUIDATION_PENALTY
        );

        factory.createMarket(
            "SpaceX Pre-IPO",
            "preSPACEX",
            address(collateral),
            address(oracle),
            INITIAL_MARGIN,
            MAINTENANCE_MARGIN,
            LIQUIDATION_PENALTY
        );

        factory.createMarket(
            "Stripe Pre-IPO",
            "preSTRIPE",
            address(collateral),
            address(oracle),
            INITIAL_MARGIN,
            MAINTENANCE_MARGIN,
            LIQUIDATION_PENALTY
        );

        assertEq(factory.getMarketCount(), 3);
    }

    function test_RevertSymbolExists() public {
        factory.createMarket(
            "OpenAI Pre-IPO",
            "preOPENAI",
            address(collateral),
            address(oracle),
            INITIAL_MARGIN,
            MAINTENANCE_MARGIN,
            LIQUIDATION_PENALTY
        );

        vm.expectRevert(PerpFactory.SymbolExists.selector);
        factory.createMarket(
            "OpenAI v2",
            "preOPENAI",
            address(collateral),
            address(oracle),
            INITIAL_MARGIN,
            MAINTENANCE_MARGIN,
            LIQUIDATION_PENALTY
        );
    }

    function test_GetMarkets() public {
        factory.createMarket(
            "OpenAI Pre-IPO",
            "preOPENAI",
            address(collateral),
            address(oracle),
            INITIAL_MARGIN,
            MAINTENANCE_MARGIN,
            LIQUIDATION_PENALTY
        );

        factory.createMarket(
            "SpaceX Pre-IPO",
            "preSPACEX",
            address(collateral),
            address(oracle),
            INITIAL_MARGIN,
            MAINTENANCE_MARGIN,
            LIQUIDATION_PENALTY
        );

        PerpFactory.MarketInfo[] memory allMarkets = factory.getAllMarkets();
        assertEq(allMarkets.length, 2);
        assertEq(allMarkets[0].symbol, "preOPENAI");
        assertEq(allMarkets[1].symbol, "preSPACEX");

        PerpFactory.MarketInfo[] memory paginated = factory.getMarkets(0, 1);
        assertEq(paginated.length, 1);
        assertEq(paginated[0].symbol, "preOPENAI");
    }

    function test_ProperOracleInMarket() public {
        address perpetualAddr = factory.createMarket(
            "OpenAI Pre-IPO",
            "preOPENAI",
            address(collateral),
            address(oracle),
            INITIAL_MARGIN,
            MAINTENANCE_MARGIN,
            LIQUIDATION_PENALTY
        );

        PerpFactory.MarketInfo memory info = factory.getMarket("preOPENAI");
        assertEq(info.oracle, address(oracle));
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
