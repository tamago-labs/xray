// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Perpetual} from "./Perpetual.sol";

contract PerpFactory {
    error ZeroAddress();
    error InvalidConfig();
    error SymbolExists();

    address public owner;

    struct MarketInfo {
        string name;
        string symbol;
        address perpetual;
        address oracle;
        uint256 createdAt;
    }

    MarketInfo[] public markets;
    mapping(string => uint256) public marketIndexBySymbol;
    mapping(address => bool) public isMarket;

    event MarketCreated(
        uint256 indexed marketId,
        string name,
        string symbol,
        address indexed perpetual,
        address indexed oracle
    );

    constructor() {
        owner = msg.sender;
    }

    function createMarket(
        string memory _name,
        string memory _symbol,
        address _collateralToken,
        address _oracle,
        uint256 _initialMarginRate,
        uint256 _maintenanceMarginRate,
        uint256 _liquidationPenaltyRate
    ) external returns (address perpetual) {
        if (_collateralToken == address(0) || _oracle == address(0)) revert ZeroAddress();
        if (bytes(_symbol).length == 0) revert InvalidConfig();
        if (marketIndexBySymbol[_symbol] != 0) revert SymbolExists();
        if (_initialMarginRate == 0 || _maintenanceMarginRate == 0) revert InvalidConfig();

        perpetual = address(
            new Perpetual(
                _name,
                _symbol,
                _collateralToken,
                _oracle,
                _initialMarginRate,
                _maintenanceMarginRate,
                _liquidationPenaltyRate
            )
        );

        uint256 marketId = markets.length;
        markets.push(
            MarketInfo({
                name: _name,
                symbol: _symbol,
                perpetual: perpetual,
                oracle: _oracle,
                createdAt: block.timestamp
            })
        );

        marketIndexBySymbol[_symbol] = marketId + 1;
        isMarket[perpetual] = true;

        emit MarketCreated(marketId, _name, _symbol, perpetual, _oracle);

        return perpetual;
    }

    function getMarket(string memory _symbol) external view returns (MarketInfo memory) {
        uint256 index = marketIndexBySymbol[_symbol];
        if (index == 0) revert InvalidConfig();
        return markets[index - 1];
    }

    function getMarketCount() external view returns (uint256) {
        return markets.length;
    }

    function getMarkets(uint256 _start, uint256 _count) external view returns (MarketInfo[] memory) {
        uint256 end = _start + _count;
        if (end > markets.length) end = markets.length;
        uint256 resultCount = end - _start;

        MarketInfo[] memory result = new MarketInfo[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = markets[_start + i];
        }
        return result;
    }

    function getAllMarkets() external view returns (MarketInfo[] memory) {
        return markets;
    }

    function transferOwnership(address _newOwner) external {
        if (msg.sender != owner) revert InvalidConfig();
        if (_newOwner == address(0)) revert ZeroAddress();
        owner = _newOwner;
    }
}
