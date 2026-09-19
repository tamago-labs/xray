// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {AggregatorV2V3Interface} from "../src/interfaces/AggregatorV2V3Interface.sol";

/// @title Mock Chainlink Aggregator for testing
contract MockAggregator is AggregatorV2V3Interface {
    int256 public answer;
    uint256 public updatedAt;
    uint8 public decimals;

    constructor(int256 _answer, uint8 _decimals) {
        answer = _answer;
        decimals = _decimals;
        updatedAt = block.timestamp;
    }

    function setAnswer(int256 _answer) external {
        answer = _answer;
        updatedAt = block.timestamp;
    }

    function setUpdatedAt(uint256 _updatedAt) external {
        updatedAt = _updatedAt;
    }

    function latestRoundData() external view returns (
        uint80 roundId,
        int256 _answer,
        uint256 startedAt,
        uint256 _updatedAt,
        uint80 answeredInRound
    ) {
        return (0, answer, 0, updatedAt, 0);
    }

    function getRoundData(uint80) external pure returns (
        uint80,
        int256,
        uint256,
        uint256,
        uint80
    ) {
        revert("not implemented");
    }

    function latestAnswer() external view returns (int256) {
        return answer;
    }

    function latestTimestamp() external view returns (uint256) {
        return updatedAt;
    }

    function latestRound() external pure returns (uint80) {
        revert("not implemented");
    }

    function getAnswer(uint80) external pure returns (int256) {
        revert("not implemented");
    }

    function getTimestamp(uint80) external pure returns (uint256) {
        revert("not implemented");
    }

    function description() external pure returns (string memory) {
        return "Mock";
    }

    function version() external pure returns (uint256) {
        return 0;
    }
}

contract PriceOracleTest is Test {
    PriceOracle public oracle;
    address public owner;
    address public bot;
    address public user;

    uint256 constant INITIAL_PRICE = 500e18; // $500 per pre-IPO token
    uint256 constant STALENESS = 3600;
    uint256 constant UPDATE_DELAY = 300;

    event PriceUpdated(string source, uint256 price, uint256 timestamp);
    event PendingPriceUpdated(uint256 pendingPrice, uint256 readyAfter);
    event PendingPriceConfirmed(uint256 confirmedPrice);
    event PendingPriceCancelled();

    function setUp() public {
        owner = address(this);
        bot = address(0xb0b);
        user = address(0x1);

        oracle = new PriceOracle(
            "OpenAI Pre-IPO",
            "preOPENAI",
            INITIAL_PRICE,
            STALENESS,
            UPDATE_DELAY
        );

        oracle.addToWhitelist(bot);
    }

    // ──────────────────────────── Constructor ────────────────────────────

    function test_Constructor() public {
        assertEq(oracle.name(), "OpenAI Pre-IPO");
        assertEq(oracle.symbol(), "preOPENAI");
        assertEq(oracle.price(), INITIAL_PRICE);
        assertEq(oracle.owner(), address(this));
        assertTrue(oracle.isStale() == false);
    }

    function test_RevertZeroInitialPrice() public {
        vm.expectRevert(PriceOracle.ZeroPrice.selector);
        new PriceOracle("Test", "TST", 0, STALENESS, UPDATE_DELAY);
    }

    // ──────────────────────────── Fallback Price ─────────────────────────

    function test_FallbackGetPrice() public {
        (uint256 price, uint256 timestamp) = oracle.getPriceWithTimestamp();
        assertEq(price, INITIAL_PRICE);
        assertEq(timestamp, block.timestamp);
    }

    // ──────────────────────────── 2-Step Commit ──────────────────────────

    function test_UpdatePrice() public {
        uint256 newPrice = 550e18; // $550 per token
        vm.warp(block.timestamp + UPDATE_DELAY);

        vm.prank(bot);
        oracle.updatePrice(newPrice);

        assertEq(oracle.pendingPrice(), newPrice);
        assertTrue(oracle.pendingPrice() > 0);
    }

    function test_RevertUpdateTooFrequent() public {
        uint256 newPrice = 550e18;
        vm.prank(bot);
        vm.expectRevert(PriceOracle.UpdateTooFrequent.selector);
        oracle.updatePrice(newPrice);
    }

    function test_RevertZeroPrice() public {
        vm.warp(block.timestamp + UPDATE_DELAY);
        vm.prank(bot);
        vm.expectRevert(PriceOracle.ZeroPrice.selector);
        oracle.updatePrice(0);
    }

    function test_RevertNotWhitelisted() public {
        vm.prank(user);
        vm.expectRevert(PriceOracle.NotWhitelisted.selector);
        oracle.updatePrice(550e18);
    }

    function test_ConfirmPriceUpdate() public {
        uint256 newPrice = 550e18;
        vm.warp(block.timestamp + UPDATE_DELAY);

        vm.prank(bot);
        oracle.updatePrice(newPrice);

        // Move past the pending delay (pendingUpdateTime = original + 2*UPDATE_DELAY)
        vm.warp(block.timestamp + 2 * UPDATE_DELAY);

        vm.prank(bot);
        vm.expectEmit(true, true, false, true);
        emit PendingPriceConfirmed(newPrice);
        oracle.confirmPriceUpdate();

        assertEq(oracle.price(), newPrice);
        assertEq(oracle.pendingPrice(), 0);
    }

    function test_RevertConfirmTooEarly() public {
        uint256 newPrice = 550e18;
        vm.warp(block.timestamp + UPDATE_DELAY);

        vm.prank(bot);
        oracle.updatePrice(newPrice);

        // Try to confirm immediately without waiting
        vm.prank(bot);
        vm.expectRevert(PriceOracle.UpdateTooFrequent.selector);
        oracle.confirmPriceUpdate();
    }

    function test_RevertConfirmNoPending() public {
        vm.prank(bot);
        vm.expectRevert(PriceOracle.NoPendingUpdate.selector);
        oracle.confirmPriceUpdate();
    }

    function test_CancelPendingUpdate() public {
        uint256 newPrice = 550e18;
        vm.warp(block.timestamp + UPDATE_DELAY);

        vm.prank(bot);
        oracle.updatePrice(newPrice);

        vm.prank(bot);
        vm.expectEmit(true, true, false, true);
        emit PendingPriceCancelled();
        oracle.cancelPendingUpdate();

        assertEq(oracle.pendingPrice(), 0);
    }

    // ──────────────────────────── Emergency Update ───────────────────────

    function test_EmergencyUpdatePrice() public {
        uint256 emergencyPrice = 450e18;
        oracle.emergencyUpdatePrice(emergencyPrice);
        assertEq(oracle.price(), emergencyPrice);
    }

    function test_RevertEmergencyNotOwner() public {
        vm.prank(bot);
        vm.expectRevert(PriceOracle.NotOwner.selector);
        oracle.emergencyUpdatePrice(450e18);
    }

    // ──────────────────────────── Staleness ──────────────────────────────

    function test_IsStale() public {
        assertFalse(oracle.isStale());
        vm.warp(block.timestamp + STALENESS + 1);
        assertTrue(oracle.isStale());
    }

    // ──────────────────────────── Chainlink Mode ─────────────────────────

    function test_SetChainlinkSource() public {
        MockAggregator agg = new MockAggregator(500e18, 18);
        oracle.setChainlinkSource(address(agg));
        assertEq(oracle.getPrice(), 500e18);
    }

    function test_ChainlinkPriceChange() public {
        MockAggregator agg = new MockAggregator(500e18, 18);
        oracle.setChainlinkSource(address(agg));
        assertEq(oracle.getPrice(), 500e18);

        agg.setAnswer(550e18);
        assertEq(oracle.getPrice(), 550e18);
    }

    function test_ChainlinkStaleReverts() public {
        MockAggregator agg = new MockAggregator(500e18, 18);
        oracle.setChainlinkSource(address(agg));

        // Warp forward so the aggregator's timestamp is stale
        vm.warp(block.timestamp + STALENESS + 1);

        vm.expectRevert(PriceOracle.PriceStale.selector);
        oracle.getPrice();
    }

    function test_ChainlinkDifferentDecimals() public {
        // 8 decimals: answer=500e8 with 8 decimals
        // Normalized: 500e8 * 10^(18-8) = 500e18
        MockAggregator agg = new MockAggregator(50000000000, 8);
        oracle.setChainlinkSource(address(agg));
        assertEq(oracle.getPrice(), 500e18);
    }

    // ──────────────────────────── Access Control ─────────────────────────

    function test_WhitelistManagement() public {
        address newBot = address(0x999);
        oracle.addToWhitelist(newBot);
        assertTrue(oracle.whitelist(newBot));

        oracle.removeFromWhitelist(newBot);
        assertFalse(oracle.whitelist(newBot));
    }

    function test_TransferOwnership() public {
        oracle.transferOwnership(bot);
        assertEq(oracle.owner(), bot);
    }

    function test_RevertTransferOwnershipZero() public {
        vm.expectRevert(PriceOracle.ZeroAddress.selector);
        oracle.transferOwnership(address(0));
    }

    // ──────────────────────────── Configuration ──────────────────────────

    function test_SetConfiguration() public {
        oracle.setStalenessThreshold(7200);
        assertEq(oracle.stalenessThreshold(), 7200);

        oracle.setPriceUpdateDelay(600);
        assertEq(oracle.priceUpdateDelay(), 600);
    }

    // ──────────────────────────── Source Switching ───────────────────────

    function test_SwitchSourceToFallback() public {
        MockAggregator agg = new MockAggregator(500e18, 18);
        oracle.setChainlinkSource(address(agg));
        assertEq(uint256(oracle.activeSource()), 1); // Chainlink

        oracle.setFallbackSource();
        assertEq(uint256(oracle.activeSource()), 0); // Fallback
        assertEq(oracle.getPrice(), INITIAL_PRICE);
    }
}

