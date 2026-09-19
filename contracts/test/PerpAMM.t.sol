// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import {PerpAMM} from "../src/PerpAMM.sol";
import {PriceOracle} from "../src/PriceOracle.sol";

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

contract PerpAMMTest is Test {
    PerpAMM public amm;
    PriceOracle public oracle;
    IERC20Mock public collateral;

    address public lp = address(0x1);
    address public trader = address(0x2);

    uint256 constant PRICE = 500e18;
    uint256 constant STALENESS = 3600;
    uint256 constant UPDATE_DELAY = 300;

    function setUp() public {
        oracle = new PriceOracle("Test", "TST", PRICE, STALENESS, UPDATE_DELAY);
        collateral = IERC20Mock(address(new MockToken("USDC", "USDC", 6)));

        amm = new PerpAMM(
            address(collateral),
            address(oracle),
            "LP Token",
            "LPT",
            0.1e18
        );
    }

    function _mintAndApprove(address who, uint256 amount, address spender) internal {
        IERC20Mock(address(collateral)).mint(who, amount);
        vm.prank(who);
        IERC20Mock(address(collateral)).approve(spender, amount);
    }

    function _setPrice(uint256 newPrice) internal {
        uint256 currentTime = block.timestamp;
        vm.warp(currentTime + UPDATE_DELAY + 1);
        oracle.updatePrice(newPrice);
        vm.warp(currentTime + 2 * UPDATE_DELAY + 2);
        oracle.confirmPriceUpdate();
    }

    function test_InitializePool() public {
        _mintAndApprove(lp, 10000e6, address(amm));

        vm.prank(lp);
        amm.initializePool(10000e6);

        (uint256 margin, uint256 position) = amm.getPoolBalances();
        assertEq(margin, 10000e6);
        assertEq(position, 0);
    }

    function test_AddLiquidity() public {
        _mintAndApprove(lp, 10000e6, address(amm));

        vm.prank(lp);
        amm.initializePool(10000e6);

        _mintAndApprove(lp, 5000e6, address(amm));

        vm.prank(lp);
        amm.addLiquidity(5000e6);

        (uint256 margin, ) = amm.getPoolBalances();
        assertEq(margin, 15000e6);
    }

    function test_RemoveLiquidity() public {
        _mintAndApprove(lp, 10000e6, address(amm));

        vm.prank(lp);
        amm.initializePool(10000e6);

        uint256 lpBalance = IERC20Mock(address(amm.lpShareToken())).balanceOf(lp);

        vm.prank(lp);
        amm.removeLiquidity(lpBalance);

        (uint256 margin, ) = amm.getPoolBalances();
        assertEq(margin, 0);
    }

    function test_Buy() public {
        _mintAndApprove(lp, 100000e6, address(amm));
        _mintAndApprove(trader, 100000e6, address(amm));

        vm.prank(lp);
        amm.initializePool(100000e6);

        uint256 size = 100e18;

        vm.prank(trader);
        amm.buy(size, type(uint256).max);

        (uint256 margin, uint256 position) = amm.getPoolBalances();
        assertGt(margin, 100000e6);
        assertEq(position, size);
    }

    function test_BuySlippageReverts() public {
        _mintAndApprove(lp, 100000e6, address(amm));
        _mintAndApprove(trader, 100000e6, address(amm));

        vm.prank(lp);
        amm.initializePool(100000e6);

        vm.prank(trader);
        vm.expectRevert(PerpAMM.SlippageExceeded.selector);
        amm.buy(100e18, 1);
    }

    function test_Sell() public {
        _mintAndApprove(lp, 100000e6, address(amm));
        _mintAndApprove(trader, 100000e6, address(amm));

        vm.prank(lp);
        amm.initializePool(100000e6);

        uint256 size = 100e18;

        vm.prank(trader);
        amm.buy(size, type(uint256).max);

        vm.prank(trader);
        amm.sell(50e18, 0);

        (uint256 margin, uint256 position) = amm.getPoolBalances();
        assertEq(position, 50e18);
    }

    function test_MarkPrice() public {
        _mintAndApprove(lp, 100000e6, address(amm));

        vm.prank(lp);
        amm.initializePool(100000e6);

        assertEq(amm.getMarkPrice(), PRICE);
    }

    function test_Premium() public {
        _mintAndApprove(lp, 100000e6, address(amm));

        vm.prank(lp);
        amm.initializePool(100000e6);

        assertEq(amm.getPremium(), 0);
    }

    function test_ShareToken() public {
        _mintAndApprove(lp, 10000e6, address(amm));

        vm.prank(lp);
        amm.initializePool(10000e6);

        assertGt(IERC20Mock(address(amm.lpShareToken())).balanceOf(lp), 0);
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
