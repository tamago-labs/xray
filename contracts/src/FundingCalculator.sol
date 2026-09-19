// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Types} from "./libraries/Types.sol";
import {SafeTransferLib} from "./libraries/SafeTransferLib.sol";
import {IERC20} from "./interfaces/IERC20.sol";

interface IERC20Metadata {
    function decimals() external view returns (uint8);
}

contract FundingCalculator {
    using SafeTransferLib for IERC20;

    error ZeroAddress();
    error IndexNotUpdated();

    IERC20 public immutable collateralToken;
    uint8 public immutable collateralDecimals;

    Types.FundingState public fundingState;
    uint256 public lastIndexPrice;
    uint256 public lastUpdateTime;

    int256 public markPremiumLimit;
    int256 public emaAlpha;
    int256 public fundingDampener;
    uint256 public fundingPeriod;

    mapping(address => int256) public accumulatedFunding;
    mapping(address => uint256) public lastSettlementTime;

    event IndexUpdated(uint256 timestamp, int256 premium, int256 emaPremium);
    event FundingSettled(address indexed trader, int256 amount);

    constructor(
        address _collateralToken,
        int256 _markPremiumLimit,
        int256 _emaAlpha,
        int256 _fundingDampener,
        uint256 _fundingPeriod
    ) {
        if (_collateralToken == address(0)) revert ZeroAddress();
        collateralToken = IERC20(_collateralToken);
        collateralDecimals = IERC20Metadata(_collateralToken).decimals();
        markPremiumLimit = _markPremiumLimit;
        emaAlpha = _emaAlpha;
        fundingDampener = _fundingDampener;
        fundingPeriod = _fundingPeriod;
        lastUpdateTime = block.timestamp;
    }

    /// @notice Updates the EMA premium and accumulates funding for the elapsed period.
    ///         Should be called periodically (e.g. hourly) by a bot.
    function updateIndex() external {
        if (block.timestamp == lastUpdateTime) revert IndexNotUpdated();

        uint256 n = block.timestamp - lastUpdateTime;
        int256 v0 = fundingState.premium;
        int256 lastPremium = fundingState.emaPremium;

        // EMA update: vt = lastPremium + (premium - lastPremium) * alpha * n
        int256 vt = v0 - lastPremium;
        vt = (vt * int256(emaAlpha) * int256(n)) / 1e18;
        vt = lastPremium + vt;

        fundingState.emaPremium = vt;
        fundingState.lastUpdateTime = block.timestamp;

        _accumulateFunding(n);

        emit IndexUpdated(block.timestamp, fundingState.premium, vt);
    }

    /// @notice Returns the current funding rate based on EMA premium.
    ///         Positive rate → longs pay shorts. Negative rate → shorts pay longs.
    ///         Zero within the dampener band.
    function getFundingRate() public view returns (int256) {
        int256 emaPremium = fundingState.emaPremium;
        if (emaPremium > int256(fundingDampener)) {
            int256 excess = emaPremium - int256(fundingDampener);
            int256 capped = excess > markPremiumLimit ? markPremiumLimit : excess;
            return capped;
        } else if (emaPremium < -int256(fundingDampener)) {
            int256 excess = emaPremium + int256(fundingDampener);
            int256 capped = excess < -markPremiumLimit ? -markPremiumLimit : excess;
            return capped;
        }
        return 0;
    }

    function getAccumulatedFunding(address trader) external view returns (int256) {
        return accumulatedFunding[trader];
    }

    /// @notice Settles accumulated funding for a trader.
    ///         Positive owed → trader receives payment. Negative → debt recorded.
    function settleFunding(address trader) external {
        int256 owed = accumulatedFunding[trader];
        if (owed == 0) return;

        accumulatedFunding[trader] = 0;
        lastSettlementTime[trader] = block.timestamp;

        if (owed > 0) {
            SafeTransferLib.safeTransfer(collateralToken, trader, uint256(owed));
        } else {
            accumulatedFunding[trader] = owed;
        }

        emit FundingSettled(trader, owed);
    }

    /// @notice Internal: accrues funding over time based on current rate.
    function _accumulateFunding(uint256 n) internal {
        int256 rate = getFundingRate();
        if (rate == 0) return;

        int256 perSecondRate = rate / int256(fundingPeriod);
        int256 totalForPeriod = perSecondRate * int256(n);

        fundingState.accumulatedFunding += totalForPeriod;
    }

    function getFundingState() external view returns (Types.FundingState memory) {
        return fundingState;
    }

    function setFundingState(Types.FundingState memory _state) external {
        fundingState = _state;
    }
}
