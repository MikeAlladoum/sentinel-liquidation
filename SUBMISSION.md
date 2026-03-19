# Sentinel de Liquidation — Hackathon Submission

**Hackathon:** Stagenet 2026  
**Status:** ✅ PRODUCTION READY  
**Submission Date:** March 19, 2026

---

## Project Summary

**Sentinel de Liquidation** is a production-grade Aave-style automated liquidation engine deployed on Stagenet.

### Quick Facts
- ✅ Contract deployed: `0x230162A10B5bc72743abDdA4f6E91E01eF5b0d0E`
- ✅ Live on Stagenet (Chain ID: 14932)
- ✅ Chainlink Oracle integration (ETH/USD)
- ✅ Full simulation tested and operational
- ✅ Open source: https://github.com/MikeAlladoum/sentinel-liquidation

---

## Deployed Contract Details

| Field | Value |
|-------|-------|
| Network | Stagenet (14932) |
| Contract | LiquidationSentinel |
| Address | `0x230162A10B5bc72743abDdA4f6E91E01eF5b0d0E` |
| Language | Solidity 0.8.20 |
| Status | Live & Operational |
| Oracle | Chainlink ETH/USD (mainnet) |
| Bonus | 5% liquidator incentive |

---

## Why This Project Matters

This project **proves Stagenet's essential role in DeFi validation:**
- Live Chainlink prices (not mocked)
- Real Ethereum state replication
- Production liquidation testing
- Risk management validation

**Problem:** Traditional testnets have frozen prices and cannot validate liquidation engines.  
**Solution:** Stagenet replays real market data block-by-block.

---

## Repository & Documentation

- **GitHub:** https://github.com/MikeAlladoum/sentinel-liquidation
- **Main Contract:** `contracts/LiquidationSentinel.sol`
- **Deploy Script:** `deploy.js`
- **Simulation:** `simulate.js`
- **Full Docs:** `README.md` + `SPECIFICATIONS.md`

---

## How to Verify

```bash
# Check contract on Stagenet explorer
https://stagenet.contract.dev/

# Contract Address:
0x230162A10B5bc72743abDdA4f6E91E01eF5b0d0E

# Run simulation
SENTINEL_ADDRESS="0x230162A10B5bc72743abDdA4f6E91E01eF5b0d0E" npx hardhat run simulate.js --network stagenet
```

---

## Key Features

### 1. Position Management
- Users deposit ETH as collateral
- Declare USD debt amount (6 decimals format)
- Set custom liquidation thresholds

### 2. Health Factor Calculation
```
HF = (collateral × price × threshold) / (debt × 10,000)
HF < 1.0 = Immediately liquidatable
```

### 3. Automatic Liquidation
- Anyone can liquidate underwater positions
- Liquidators earn 5% bonus on collateral
- Double-liquidation impossible (position marked as liquidated)

### 4. Live Oracle Integration
- Queries Chainlink ETH/USD mainnet feed in real-time
- Validates price staleness (< 3600 seconds)
- Decimal-precise calculations (8 → 6 → 18 conversions)

---

## Security Features

✅ Custom error handling (EIP-6093)  
✅ Oracle staleness verification  
✅ CEI pattern (Checks-Effects-Interactions)  
✅ Double-liquidation prevention  
✅ Solidity 0.8.20 checked arithmetic  

---

**Stagenet Hackathon 2026 | Sentinel de Liquidation**
