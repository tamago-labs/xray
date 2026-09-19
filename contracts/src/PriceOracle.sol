// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IPreIpoOracle} from "./interfaces/IPreIpoOracle.sol";
import {AggregatorV2V3Interface} from "./interfaces/AggregatorV2V3Interface.sol";
import {Types} from "./libraries/Types.sol";

/// @title PriceOracle
/// @notice Multi-source price oracle for pre-IPO token prices
/// @dev Supports 3 price sources: Fallback (admin-push), Chainlink, Pyth
///      Uses a 2-step commit mechanism for fallback updates (updatePrice → confirmPriceUpdate)
///      Designed for the Xray Pre-IPO Perpetual DEX
contract PriceOracle is IPreIpoOracle {
    // ──────────────────────────── Custom Errors ────────────────────────
    error NotOwner();
    error NotWhitelisted();
    error ZeroAddress();
    error ZeroPrice();
    error PriceStale();
    error UpdateTooFrequent();
    error InvalidOracleSource();
    error NoPendingUpdate();
    error NotInFallbackMode();
    error ZeroThreshold();
    error ZeroDelay();
    error ZeroPriceId();

    // ──────────────────────────── Immutables ────────────────────────────
    string public name;
    string public symbol;

    // ──────────────────────────── Admin ─────────────────────────────────
    address public owner;
    mapping(address => bool) public whitelist;

    // ──────────────────────────── Price State ───────────────────────────
    uint256 public price;
    uint256 public lastPriceUpdateTime;
    Types.OracleSource public source;

    // ──────────────────────────── Pending Update (2-step commit) ────────
    uint256 public pendingUpdatePrice;
    uint256 public pendingUpdateTime;
    bool public hasPendingUpdate;

    // ──────────────────────────── Chainlink Feed ────────────────────────
    address public chainlinkAggregator;

    // ──────────────────────────── Pyth Feed ─────────────────────────────
    address public pythContract;
    bytes32 public pythPriceId;

    // ──────────────────────────── Configuration ─────────────────────────
    uint256 public stalenessThreshold;
    uint256 public priceUpdateDelay;

    // ──────────────────────────── Events ────────────────────────────────
    event PriceUpdated(string source, uint256 price, uint256 timestamp);
    event PendingPriceUpdated(uint256 pendingPrice, uint256 readyAfter);
    event PendingPriceConfirmed(uint256 confirmedPrice);
    event PendingPriceCancelled();
    event WhitelistUpdated(address indexed user, bool whitelisted);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event OracleSourceChanged(Types.OracleSource newSource);
    event ChainlinkFeedSet(address aggregator);
    event PythFeedSet(address pythContract, bytes32 priceId);
    event StalenessThresholdUpdated(uint256 newThreshold);
    event PriceUpdateDelayUpdated(uint256 newDelay);

    // ──────────────────────────── Modifiers ─────────────────────────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyWhitelisted() {
        if (!whitelist[msg.sender]) revert NotWhitelisted();
        _;
    }

    // ──────────────────────────── Constructor ───────────────────────────
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialPrice,
        uint256 _stalenessThreshold,
        uint256 _priceUpdateDelay
    ) {
        if (_initialPrice == 0) revert ZeroPrice();
        owner = msg.sender;
        whitelist[msg.sender] = true;

        name = _name;
        symbol = _symbol;
        price = _initialPrice;
        lastPriceUpdateTime = block.timestamp;
        source = Types.OracleSource.Fallback;
        stalenessThreshold = _stalenessThreshold;
        priceUpdateDelay = _priceUpdateDelay;

        emit PriceUpdated("fallback", _initialPrice, block.timestamp);
    }

    // ──────────────────────────── IPreIpoOracle ─────────────────────────

    /// @inheritdoc IPreIpoOracle
    function getPrice() external view returns (uint256) {
        return _getActivePrice();
    }

    /// @inheritdoc IPreIpoOracle
    function getPriceWithTimestamp() external view returns (uint256, uint256) {
        return (_getActivePrice(), lastPriceUpdateTime);
    }

    /// @inheritdoc IPreIpoOracle
    function activeSource() external view returns (Types.OracleSource) {
        return source;
    }

    /// @inheritdoc IPreIpoOracle
    function isStale() external view returns (bool) {
        return block.timestamp - lastPriceUpdateTime > stalenessThreshold;
    }

    /// @inheritdoc IPreIpoOracle
    function pendingPrice() external view returns (uint256) {
        return hasPendingUpdate ? pendingUpdatePrice : 0;
    }

    // ──────────────────────────── Fallback: 2-Step Commit ───────────────

    /// @notice Step 1: Propose a new fallback price.
    /// @param newPrice The proposed price in USD (18 decimals)
    function updatePrice(uint256 newPrice) external onlyWhitelisted {
        if (source != Types.OracleSource.Fallback) revert NotInFallbackMode();
        if (newPrice == 0) revert ZeroPrice();
        if (block.timestamp < lastPriceUpdateTime + priceUpdateDelay) revert UpdateTooFrequent();

        pendingUpdatePrice = newPrice;
        pendingUpdateTime = block.timestamp + priceUpdateDelay;
        hasPendingUpdate = true;

        emit PendingPriceUpdated(newPrice, pendingUpdateTime);
    }

    /// @notice Step 2: Confirm and apply the pending price after delay has passed.
    function confirmPriceUpdate() external onlyWhitelisted {
        if (!hasPendingUpdate) revert NoPendingUpdate();
        if (block.timestamp < pendingUpdateTime) revert UpdateTooFrequent();

        uint256 confirmedPrice = pendingUpdatePrice;
        price = confirmedPrice;
        lastPriceUpdateTime = block.timestamp;
        hasPendingUpdate = false;

        emit PendingPriceConfirmed(confirmedPrice);
        emit PriceUpdated("fallback", confirmedPrice, block.timestamp);
    }

    /// @notice Cancel a pending price update.
    function cancelPendingUpdate() external onlyWhitelisted {
        if (!hasPendingUpdate) revert NoPendingUpdate();

        hasPendingUpdate = false;

        emit PendingPriceCancelled();
    }

    /// @notice Emergency price update (skips delay, only owner). For crisis situations.
    /// @param newPrice The emergency price
    function emergencyUpdatePrice(uint256 newPrice) external onlyOwner {
        if (source != Types.OracleSource.Fallback) revert NotInFallbackMode();
        if (newPrice == 0) revert ZeroPrice();

        price = newPrice;
        lastPriceUpdateTime = block.timestamp;
        hasPendingUpdate = false;

        emit PriceUpdated("emergency", newPrice, block.timestamp);
    }

    // ──────────────────────────── Internal Price Fetcher ───────────────

    function _getActivePrice() internal view returns (uint256) {
        if (source == Types.OracleSource.Fallback) {
            return price;
        } else if (source == Types.OracleSource.Chainlink) {
            return _getChainlinkPrice();
        } else if (source == Types.OracleSource.Pyth) {
            return _getPythPrice();
        } else {
            revert InvalidOracleSource();
        }
    }

    function _getChainlinkPrice() internal view returns (uint256) {
        if (chainlinkAggregator == address(0)) revert("chainlink feed not set");

        (
            ,
            int256 answer,
            ,
            uint256 updatedAt,
        ) = AggregatorV2V3Interface(chainlinkAggregator).latestRoundData();

        if (answer <= 0) revert("invalid chainlink price");
        if (block.timestamp - updatedAt > stalenessThreshold) revert PriceStale();

        uint8 aggDecimals = AggregatorV2V3Interface(chainlinkAggregator).decimals();
        uint256 aggPrice = uint256(answer);

        if (aggDecimals < 18) {
            aggPrice = aggPrice * (10 ** (18 - aggDecimals));
        } else if (aggDecimals > 18) {
            aggPrice = aggPrice / (10 ** (aggDecimals - 18));
        }

        return aggPrice;
    }

    function _getPythPrice() internal view returns (uint256) {
        if (pythContract == address(0)) revert("pyth feed not set");

        (uint256 rawPrice, ) = IPythOracle(pythContract).getPriceNoOlderThan(stalenessThreshold, pythPriceId);
        if (rawPrice == 0) revert ZeroPrice();

        return rawPrice;
    }

    // ──────────────────────────── Admin: Source Configuration ──────────

    /// @notice Switch to Chainlink as the active oracle source.
    function setChainlinkSource(address aggregator) external onlyOwner {
        if (aggregator == address(0)) revert ZeroAddress();
        chainlinkAggregator = aggregator;
        source = Types.OracleSource.Chainlink;
        emit ChainlinkFeedSet(aggregator);
        emit OracleSourceChanged(Types.OracleSource.Chainlink);
    }

    /// @notice Switch to Pyth as the active oracle source.
    function setPythSource(address pythAddr, bytes32 priceId) external onlyOwner {
        if (pythAddr == address(0)) revert ZeroAddress();
        if (priceId == bytes32(0)) revert ZeroPriceId();
        pythContract = pythAddr;
        pythPriceId = priceId;
        source = Types.OracleSource.Pyth;
        emit PythFeedSet(pythAddr, priceId);
        emit OracleSourceChanged(Types.OracleSource.Pyth);
    }

    /// @notice Switch back to Fallback (admin-push) mode.
    function setFallbackSource() external onlyOwner {
        source = Types.OracleSource.Fallback;
        emit OracleSourceChanged(Types.OracleSource.Fallback);
    }

    // ──────────────────────────── Admin: Configuration ──────────────────

    function setStalenessThreshold(uint256 newThreshold) external onlyOwner {
        if (newThreshold == 0) revert ZeroThreshold();
        stalenessThreshold = newThreshold;
        emit StalenessThresholdUpdated(newThreshold);
    }

    function setPriceUpdateDelay(uint256 newDelay) external onlyOwner {
        if (newDelay == 0) revert ZeroDelay();
        priceUpdateDelay = newDelay;
        emit PriceUpdateDelayUpdated(newDelay);
    }

    // ──────────────────────────── Access Control ────────────────────────

    function addToWhitelist(address user) external onlyOwner {
        whitelist[user] = true;
        emit WhitelistUpdated(user, true);
    }

    function removeFromWhitelist(address user) external onlyOwner {
        whitelist[user] = false;
        emit WhitelistUpdated(user, false);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

/// @title IPythOracle
/// @notice Minimal interface for Pyth price fetching
interface IPythOracle {
    function getPriceNoOlderThan(uint256 age, bytes32 id) external view returns (uint256 price, uint256 publishTime);
}

