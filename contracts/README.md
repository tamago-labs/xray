# Xray Pre-IPO Perpetual DEX — Smart Contracts

A perpetual swap DEX for pre-IPO token prices. Trade synthetic exposure to companies like OpenAI, SpaceX, and Stripe before they go public. Built with [Foundry](https://book.getfoundry.sh/).

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Perpetual                           │
│  (Main entry point — deposit, trade, liquidate, settle)  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ PriceOracle  │  │  PerpAMM     │  │ FundingCalc   │  │
│  │              │  │              │  │               │  │
│  │ • Fallback   │  │ • Pricing    │  │ • EMA premium │  │
│  │ • Chainlink  │  │ • LP tokens  │  │ • Dampener    │  │
│  │ • Pyth       │  │ • Liquidity  │  │ • Settlement  │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│                                                          │
│  • Position tracking  • Margin checks  • Liquidations    │
│  • PnL settlement     • Token custody  • Emergency       │
└──────────────────────────────────────────────────────────┘
```

## Contracts

### PriceOracle (`src/PriceOracle.sol`)

Multi-source price oracle for pre-IPO token valuations (e.g. OpenAI at $370/share).

- **Sources**: Fallback (admin-push), Chainlink, Pyth
- **2-step commit**: `updatePrice()` → `confirmPriceUpdate()` (time-locked)
- **Emergency bypass**: owner can push instantly in crisis
- **Decimal normalization**: auto-adjusts between feed decimals (e.g. Chainlink 8dp → 18dp)

```solidity
// Bot proposes a new price (must wait UPDATE_DELAY)
oracle.updatePrice(370e18);

// After delay, confirm to apply
oracle.confirmPriceUpdate();
```

### PerpAMM (`src/PerpAMM.sol`)

Automated market maker that uses the oracle price as its base and applies a utilization-based spread.

- **Base price**: always falls back to oracle when pool is empty
- **Buy premium**: `oraclePrice * (1 + utilization * 1%)` — price rises as pool gets long
- **Sell discount**: `oraclePrice * (1 - utilization * 0.5%)` — price falls as pool gets short
- **LP deposits**: add/remove collateral, receive LP share tokens
- **Decimal-aware**: handles USDC (6dp) vs oracle (18dp) conversion

```solidity
// LP initializes pool with collateral
amm.initializePool(100_000e6);  // $100k USDC

// Trader opens long 10 preOPENAI at current AMM price
uint256 avgPrice = amm.buy(10e18, type(uint256).max);
```

### Perpetual (`src/Perpetual.sol`)

Main entry point. Deploys its own AMM and coordinates all components.

- **Deposit/withdraw**: traders deposit USDC collateral
- **Trade**: open long/short via AMM pricing
- **Liquidate**: anyone can liquidate undercollateralized positions
- **Emergency**: owner can pause trading
- **Settle & Close**: owner settles at IPO price, market permanently closes
- **Token custody**: holds all USDC, settles PnL internally

```solidity
// Full trade flow
perpetual.deposit(10_000e6);                    // Deposit $10k
perpetual.openPosition(Side.LONG, 5e18);         // Long 5 tokens
perpetual.closePosition();                        // Close at current price
perpetual.withdraw(5_000e6);                      // Withdraw profits

// Settlement (after IPO)
perpetual.settle(ipoPrice);                      // Owner settles at IPO price
perpetual.settlePosition();                       // Trader exits at settlement price
perpetual.withdraw(remaining);                    // Withdraw settled funds
```

### PositionManager (`src/PositionManager.sol`)

Handles margin, liquidations, and PnL tracking.

- **Initial margin**: 10% (configurable)
- **Maintenance margin**: 5% (configurable)
- **Liquidation penalty**: 0.5% to liquidator
- **Margin ratio**: `(collateral + PnL) / notional`
- **Decimal-aware PnL**: converts between 18dp pricing and 6dp collateral

### FundingCalculator (`src/FundingCalculator.sol`)

Funding rate mechanism to tether AMM mark price to oracle spot price.

- **EMA premium**: exponential moving average of (mark − spot)
- **Dampener band**: ±0.05% where no funding is charged
- **Premium cap**: ±0.5% max funding rate
- **Settlement**: traders settle accumulated funding

### LpShareToken (`src/LpShareToken.sol`)

Standard ERC20 representing pool ownership. LPs mint shares on deposit, burn on withdrawal.

## Key Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Initial Margin | 10% | Required to open a position |
| Maintenance Margin | 5% | Minimum to avoid liquidation |
| Liquidation Penalty | 0.5% | Paid to liquidator |
| Funding Period | 8 hours | Funding rate calculation window |
| EMA Half-life | ~20 min | Premium smoothing |
| Funding Dampener | 0.05% | No-funding band |
| Premium Limit | 0.5% | Max funding rate |
| Update Delay | 5 min | Min time between price updates |
| Staleness | 1 hour | Oracle price expiry |

## Trade Flow

```
1. LP adds liquidity
   └─► amm.initializePool(USDC) → mints LP shares

2. Trader deposits collateral
   └─► perpetual.deposit(USDC) → tokens held in contract

3. Trader opens position
   └─► perpetual.openPosition(LONG, size)
       ├─► amm.getBuyPrice(size) → uses oracle + utilization spread
       └─► records position (side, size, entryPrice)

4. Price moves (oracle updates via bot)
   └─► oracle.updatePrice() → confirmPriceUpdate()

5. Funding accrues (if position open across funding period)
   └─► funding.updateIndex() → accumulates based on EMA premium

6. Trader closes position
   └─► perpetual.closePosition()
       ├─► oracle.getPrice() → current exit price
       └─► settles PnL to trader's collateral

7. Trader withdraws
   └─► perpetual.withdraw(amount) → USDC back to wallet
```

## Settlement Flow (After IPO)

```
1. Owner declares settlement price
   └─► perpetual.settle(ipoPrice) → market status = SETTLED
       └─► No new deposits or positions allowed

2. Traders settle positions
   └─► perpetual.settlePosition()
       ├─► Calculates PnL at settlement price (not oracle)
       └─► Credits profit or subtracts loss from collateral

3. Anyone can withdraw
   └─► perpetual.withdraw(amount) → works in SETTLED state

4. LPs can remove liquidity
   └─► amm.removeLiquidity(shares) → market is permanently closed
```

## Margin & Liquidation

```
Margin Ratio = (Collateral + Unrealized PnL) / Notional Value

  100% ─ ┬─ Healthy
         │
   10%  ─├─ Initial margin (required to open)
         │
    5%  ─├─ Maintenance margin (minimum to keep open)
         │
    0%  ─└─ Liquidatable (anyone can liquidate, receives 0.5% penalty)
```

## Testing

```bash
# All tests
forge test

# Specific suite
forge test --match-path test/Integration.t.sol

# Verbose
forge test -vvvv

# Gas report
forge test --gas-report
```

**83 tests passing** across 7 suites: unit tests for each contract + full multi-contract integration tests.

## Development

```bash
# Build
forge build

# Test
forge test

# Format
forge fmt

# Coverage
forge coverage
```

## Design Notes

- **No upgradeable proxies**: immutable contracts for trust minimization
- **No governance token**: owner-controlled for testnet, can be renounced
- **Decimal-agnostic**: works with any collateral decimals (USDC 6dp, DAI 18dp, etc.)
- **AMM is pricing-only**: Perpetual holds tokens, AMM provides price quotes
- **Oracle-agnostic**: supports admin-push, Chainlink, or Pyth feeds
