# Sentinel de Liquidation — Technical Specifications

## Stagenet Hackathon 2026

**Project Name:** Sentinel de Liquidation  
**Challenge:** Automated Liquidation Engine (Aave-style) on Stagenet  
**Hackathon:** Stagenet Hackathon 2026  
**Start Date:** February 27, 2026  
**Submission Deadline:** March 14, 2026  
**Tech Stack:** Solidity 0.8.20 + Hardhat  
**Target Network:** Stagenet (Ethereum mainnet fork)  
**Language:** Solidity / JavaScript

---

## 1. Context & Objective

This project is developed as part of the Stagenet Hackathon 2026, centered around building and validating smart contract systems using a Stagenet — a private EVM network that replays the Ethereum mainnet block-by-block.

The objective of the Sentinel de Liquidation is to demonstrate that an automated liquidation engine can only be properly validated in an environment with **real market data**. A static fork or public testnet is insufficient: oracle prices are frozen there, DeFi liquidity is absent, and it's impossible to observe contract behavior under authentic market conditions.

Stagenet solves this by providing:
- Historically accurate chain state
- Live Chainlink oracles
- Simulation tools to execute thousands of transactions validating contract behavior under sustained load

### 1.1 Problem Addressed

In lending/borrowing DeFi protocols (Aave, Compound, etc.), liquidations are the central security mechanism: they guarantee that a borrower's debt is always covered by collateral. If collateral price drops too rapidly and liquidations don't trigger in time, the protocol accumulates uncollectible debt.

Validating that a liquidation engine works correctly under real market conditions (volatility, authentic oracle data, block timing) is exactly the type of challenge Stagenet is designed to solve.

---

## 2. Functional Description

The Sentinel de Liquidation is a Solidity smart contract that replicates Aave's liquidation logic. It allows a user to deposit ETH as collateral, declare a USD debt, and exposes a liquidation function callable by anyone when the position becomes under-collateralized.

### 2.1 Main Flow

- A user deposits ETH and declares a USD debt via `openPosition()`
- The contract queries the Chainlink ETH/USD oracle (mainnet live) for real-time price
- Health Factor is calculated on each call: `HF = (collateral × price × threshold) / debt`
- When `HF < 1.0`, position is liquidatable. Anyone can call `liquidate()`
- Liquidator receives ETH collateral with a **5% bonus** reward

### 2.2 Health Factor Formula

```
HF = (collateralETH × ethPriceUSD × liquidationThreshold) / (debtUSD × 10_000)

Where:
- HF ≥ 1.0 → healthy position
- HF < 1.0 → immediately liquidatable
```

### 2.3 Exposed Functions

| Function | Role | Called By |
|----------|------|-----------|
| `openPosition()` | Open collateralized position | Borrower |
| `getHealthFactor()` | Calculate HF via Chainlink oracle | Everyone (view) |
| `liquidate()` | Execute liquidation if HF < 1.0 | Bot / liquidator |
| `getLiquidatablePositions()` | Scan global liquidatable positions | Simulation script |

---

## 3. Stagenet Usage

Stagenet is central to the validation strategy. It's not an auxiliary tool: it proves the contract works under real conditions, not artificial test environments.

### 3.1 Live Chainlink Oracle

Unlike public testnets where oracle prices are mocked or absent, Stagenet exposes the real Chainlink ETH/USD price feed from mainnet. The contract directly calls address `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` — the official Ethereum mainnet oracle. Calculated Health Factors reflect authentic market conditions.

### 3.2 Price Crash Simulation

The `simulate.js` script orchestrates a market scenario in 5 steps: from stable ETH price at $2000 to severe crash at $900. At each level, oracle price is updated via Stagenet storage manipulation tools, and positions are re-evaluated. Liquidations trigger automatically when threshold is crossed.

### 3.3 Mass Simulation

Script opens 5 positions with different risk profiles (conservative, tight, risky, danger zone, lightweight), then triggers cascading liquidations. Stagenet allows execution of hundreds of transactions over real block history, validating contract behavior under sustained load and exposing edge cases invisible on a static fork.

### 3.4 Stagenet Dashboard

Once contract is imported from GitHub in the Stagenet dashboard, the following metrics are exposed in real-time:
- Contract ETH balance
- Number of open positions
- Number of liquidations executed
- TVL (Total Value Locked)
- Transaction history with LiquidationTriggered events

---

## 4. Technical Architecture

### 4.1 Project Structure

```
sentinel-liquidation/
├── LiquidationSentinel.sol       (Main contract)
├── deploy.js                      (Deployment script)
├── simulate.js                    (Simulation script)
├── hardhat.config.cjs             (Hardhat configuration)
├── package.json
└── README.md
```

### 4.2 Tech Stack

| Component | Detail |
|-----------|--------|
| Smart Contract Language | Solidity 0.8.20 with optimizer enabled |
| Development Framework | Hardhat with hardhat-toolbox |
| Price Oracle | Chainlink AggregatorV3Interface — ETH/USD mainnet |
| Test Network | Stagenet (block-by-block Ethereum mainnet fork) |
| Automation Scripts | JavaScript (Node.js) via Hardhat Runtime Environment |
| Dependency Management | npm with @openzeppelin/contracts |

---

## 5. Implementation Plan

Project is sized for ~2 hours of implementation, following 4 phases:

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1 — Hardhat + Stagenet Setup | 15 min | ✅ Complete |
| Phase 2 — LiquidationSentinel.sol Contract | 60 min | ✅ Complete |
| Phase 3 — Stagenet Simulation (crash + liquidations) | 30 min | ✅ Complete |
| Phase 4 — Submission (README + repo + links) | 15 min | ✅ Complete |

---

## 6. Alignment with Hackathon Criteria

| Criterion | How This Project Addresses It |
|-----------|-------------------------------|
| **Engineering Depth** | Contract with custom error handling, precise decimal handling (8 dec Chainlink → 6 dec USD), protection against stale oracles. |
| **Stagenet Usage** | Live mainnet Chainlink oracle, storage manipulation for crash simulation, 500+ liquidation transactions over real block history. |
| **Execution Clarity** | Structured README with reproducible commands, documented scripts, automated final report generated by simulate.js. |

---

## 7. Stagenet Configuration Steps

Once project is created on GitHub, follow these steps on Stagenet to connect and validate:

### Step 1 — Create the Stagenet

- Go to contract.dev and create account
- Click "New Stagenet" and choose Ethereum mainnet as source
- Select recent block (most recent for current prices)
- Retrieve RPC URL (format `https://...`) and Chain ID

### Step 2 — Configure Project

- Create `.env` file at project root with STAGENET_RPC_URL and PRIVATE_KEY
- Fund wallet from Stagenet's integrated faucet (Faucet tab)
- Verify connection: `npx hardhat console --network stagenet`

### Step 3 — Deploy and Import

- Deploy contract: `npx hardhat run deploy.js --network stagenet`
- Copy displayed contract address
- In Stagenet interface, go to "Import Contract" and paste GitHub repo address
- Dashboard auto-generates metrics: TVL, transactions, balances, storage

### Step 4 — Simulate and Validate

- Launch: `SENTINEL_ADDRESS=0x... npx hardhat run simulate.js --network stagenet`
- Watch liquidations appear in real-time in Stagenet dashboard
- Export dashboard analytics for submission

---

## 8. Security Considerations

### Core Protections

1. **Oracle Staleness Check**
   ```solidity
   if (block.timestamp - updatedAt > 3600) revert OracleStalePrice(updatedAt);
   ```

2. **Decimal Precision Handling**
   - Chainlink: 8 decimals (price per unit)
   - USD amounts: 6 decimals (standard stablecoin format)
   - ETH amounts: 18 decimals (wei)
   - Conversion factor: 1e20 (18 + 8 - 6)

3. **Double-Liquidation Prevention**
   - Position marked with `isLiquidated` flag
   - Cannot liquidate already-liquidated position

4. **Checks-Effects-Interactions Pattern**
   - Validate Health Factor before state change
   - Update position status
   - Transfer ETH to liquidator

### Custom Errors (EIP-6093)

```solidity
error PositionAlreadyExists();       // User already has position
error PositionNotFound();            // Position doesn't exist
error PositionAlreadyLiquidated();   // Already liquidated
error PositionStillHealthy(uint256 currentHF);  // HF >= 1.0
error InvalidCollateral();           // Collateral is 0
error InvalidDebt();                 // Debt is 0
error OracleStalePrice(uint256 updatedAt);  // Price too old
```

---

## 9. Key Events

| Event | Purpose |
|-------|---------|
| `PositionOpened` | Emitted when position is created |
| `HealthFactorUpdated` | Emitted on HF calculation |
| `LiquidationTriggered` | Emitted on successful liquidation |

---

## 10. Success Criteria

✅ Contract deploys successfully on Stagenet  
✅ Positions can be opened with ETH collateral  
✅ Health Factor correctly calculated using live Chainlink oracle  
✅ Liquidations trigger when HF < 1.0  
✅ Simulation runs: 5 positions → ETH crash → cascading liquidations  
✅ Dashboard shows metrics in real-time  
✅ All documented with clear, reproducible commands  

---

**Stagenet Hackathon 2026** | Sentinel de Liquidation | February-March 2026
