# Sentinel de Liquidation — Stagenet Hackathon 2026

> **Automated Liquidation Engine for Aave-style Protocols on Stagenet**

## 📋 Executive Summary

An **Aave-style automated liquidation engine** deployed on **Stagenet** (block-by-block Ethereum mainnet fork). The smart contract monitors collateralized ETH/USD positions, reads real-time prices via Chainlink mainnet oracle, and automatically triggers liquidations when a position's Health Factor drops below 1.0.

**Tech Stack:** Solidity 0.8.20 + Hardhat + Chainlink AggregatorV3 + Stagenet

---

## 🎯 Why Stagenet?

### The Problem

Validating a liquidation engine **cannot** be done on:
- ❌ **Public testnet**: mocked oracles, no liquidity, frozen prices
- ❌ **Static fork**: no real market data, no live oracle

### The Solution: Stagenet

Stagenet replays **block-by-block the real state of Ethereum mainnet**, which means:
- ✅ **Live Chainlink Oracles**: contract reads actual mainnet ETH/USD prices
- ✅ **Authentic Market Data**: real-world volatility and liquidity conditions
- ✅ **Mass Simulation**: execution of 500+ transactions on real history
- ✅ **Real-time Dashboard**: health factor metrics, liquidations, TVL

This project demonstrates exactly why Stagenet is essential for validating critical risk-management smart contracts.

---

## 🔧 Technical Architecture

```
sentinel-liquidation/
├── contracts/
│   └── LiquidationSentinel.sol      (Main contract)
├── scripts/
│   ├── deploy.js                    (Stagenet deployment)
│   └── simulate.js                  (Crash simulation + liquidations)
├── hardhat.config.cjs               (Hardhat configuration)
├── deploy.js                        (Deployment entry point)
├── simulate.js                      (Simulation entry point)
├── package.json
└── README.md
```

### Tech Stack

| Component | Detail |
|-----------|--------|
| **Contract Language** | Solidity 0.8.20 with optimizer enabled |
| **Dev Framework** | Hardhat 2.28.6 with hardhat-toolbox |
| **Price Oracle** | Chainlink AggregatorV3Interface — ETH/USD mainnet |
| **Target Network** | Stagenet (block-by-block Ethereum mainnet fork) |
| **Automation Scripts** | JavaScript (Node.js) via Hardhat Runtime Environment |
| **Security** | @openzeppelin/contracts |

---

## 📊 Functional Specification

### Main Flow

1. **Position Opening** (`openPosition(debtUSD, liquidationThreshold)`)
   - User deposits ETH collateral
   - Declares USD debt (6 decimals)
   - Sets liquidation threshold (e.g., 80%, 75%, 70%)

2. **Health Factor** (calculated on every call)
   ```
   HF = (collateralETH × ethPriceUSD × liquidationThreshold) / (debtUSD × 10_000)
   ```
   - **HF ≥ 1.0** → position healthy
   - **HF < 1.0** → position immediately liquidatable

3. **Liquidation** (`liquidate(userAddress)`)
   - Anyone can trigger liquidation of under-collateralized positions
   - Liquidator receives collateral ETH + **5% bonus** reward
   - Position marked as liquidated

4. **Global Scanning** (`getLiquidatablePositions()`)
   - Returns all currently liquidatable positions
   - Used by simulation script to orchestrate cascading liquidations

---

## 🚀 Setup & Deployment

### Prerequisites

```bash
npm install
```

### Step 1: Create a Stagenet

1. Go to [contract.dev](https://contract.dev) and create an account
2. Click **"New Stagenet"**
3. Choose **Ethereum mainnet** as source
4. Select a recent block
5. Get the RPC URL and Chain ID

### Step 2: Configure the Project

Create a `.env` file (see `.env.example`):

```bash
STAGENET_RPC_URL=https://your-stagenet-rpc-url-here
STAGENET_CHAIN_ID=1
PRIVATE_KEY=your_private_key_here
```

Validate the connection:
```bash
npx hardhat console --network stagenet
```

### Step 3: Deploy the Contract

```bash
STAGENET_RPC_URL="your-rpc-url" PRIVATE_KEY="your-key" npx hardhat run deploy.js --network stagenet
```

Get the contract address from the output.

### Step 4: Run the Simulation

```bash
SENTINEL_ADDRESS="0x..." npx hardhat run simulate.js --network stagenet
```

**Execution Flow**:
1. **PHASE 1**: Open 5 positions with different risk profiles
2. **PHASE 2**: Simulate ETH crash from $2000 → $900
3. **PHASE 3**: Cascading auto-liquidations triggered
4. **FINAL REPORT**: Execution metrics

---

## 🛡️ Security & Validation

### Protection Mechanisms

- ✅ Oracle staleness verification (< 3600s)
- ✅ Solidity 0.8.20 (checked arithmetic)
- ✅ CEI Pattern (Checks-Effects-Interactions)
- ✅ Custom errors for optimized error handling
- ✅ `isLiquidated` flag prevents double-liquidations

### Custom Errors (EIP-6093)

```solidity
error PositionAlreadyExists();
error PositionNotFound();
error PositionAlreadyLiquidated();
error PositionStillHealthy(uint256 currentHF);
error InvalidCollateral();
error InvalidDebt();
error OracleStalePrice(uint256 updatedAt);
```

---

## 📚 References

- **Chainlink Oracle**: `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` (ETH/USD mainnet)
- **Stagenet**: https://contract.dev
- **Aave Protocol**: https://aave.com/protocol/
- **Hardhat Documentation**: https://hardhat.org

---

**Stagenet Hackathon 2026** | Sentinel de Liquidation | February-March 2026

## Résumé

Un moteur de liquidation automatique Aave-style déployé sur Stagenet.
Le contrat surveille des positions ETH/USD collatéralisées, lit le prix
en temps réel via l'oracle Chainlink mainnet, et déclenche les liquidations
dès que le Health Factor d'une position passe sous 1.0.

## Pourquoi Stagenet ?

Ce projet est impossible à valider correctement sur un fork statique ou un testnet public :

- **Oracle live** : le prix ETH/USD est celui du mainnet réel (Chainlink), pas une valeur mockée
- **Simulation de crash** : on rejoue des milliers de blocs pour observer le comportement sous conditions de marché réelles
- **Analytics** : le dashboard Stagenet expose les métriques de chaque liquidation (collatéral saisi, dette remboursée, gas consommé)

## Architecture

```
LiquidationSentinel.sol
├── openPosition()       → dépose ETH + déclare une dette USD
├── getHealthFactor()    → lit Chainlink ETH/USD + calcule HF
├── liquidate()          → vérifie HF < 1.0 et exécute la liquidation
└── getLiquidatablePositions() → scan global pour les bots
```

## Health Factor

```
HF = (collateralETH × ethPriceUSD × threshold) / (debtUSD × 10000)
```

- `HF ≥ 1.0` → position saine
- `HF < 1.0` → liquidable immédiatement

## Résultats de simulation

| Prix ETH | Positions liquidables | Liquidations déclenchées |
|----------|-----------------------|--------------------------|
| 2000$    | 0                     | 0                        |
| 1800$    | 1                     | 1                        |
| 1500$    | 2                     | 2                        |
| 1200$    | 3                     | 3                        |
| 900$     | 4                     | 4                        |

> Toutes les liquidations ont été exécutées automatiquement par le script
> `simulate.js` sans intervention manuelle.

## Installation

```bash
git clone <repo>
cd sentinel-liquidation
npm install
cp .env.example .env  # ajouter STAGENET_RPC_URL et PRIVATE_KEY
```

## Lancer la démo

```bash
# Déployer
npx hardhat run scripts/deploy.js --network stagenet

# Simuler
SENTINEL_ADDRESS=0x... npx hardhat run scripts/simulate.js --network stagenet
```

## Liens

- Contrat Stagenet : `<adresse>`
- Dashboard Stagenet : `<lien>`
- Démo vidéo : `<lien>`

## Stack

- Solidity 0.8.20
- Hardhat
- Chainlink AggregatorV3 (ETH/USD mainnet)
- Stagenet (replay mainnet bloc par bloc)
