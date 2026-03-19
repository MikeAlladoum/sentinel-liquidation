# Deployment Report — Sentinel de Liquidation

**Status:** ✅ LIVE ON STAGENET  
**Date:** March 19, 2026  
**Network:** Stagenet (Chain ID: 14932)

---

## Contract Address

```
0x230162A10B5bc72743abDdA4f6E91E01eF5b0d0E
```

---

## Deployment Configuration

| Setting | Value |
|---------|-------|
| Deployer Wallet | `0x5b0E4eCEfd39e3c491728Aa8af5b49a83caD94B4` |
| Chainlink Oracle | `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` |
| Liquidator Bonus | 500 basis points (5%) |
| Solidity Version | 0.8.20 |
| Optimizer Runs | 200 |
| Contract Size | 8,697 bytes (under limit) |

---

## Verification

### View on Stagenet Explorer
```
https://stagenet.contract.dev/address/0x230162A10B5bc72743abDdA4f6E91E01eF5b0d0E
```

### Oracle Configuration
- **Address:** `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419`
- **Feed:** ETH/USD (Live mainnet data)
- **Decimals:** 8
- **Max Age:** 3600 seconds

### Run Simulation
```bash
export SENTINEL_ADDRESS="0x230162A10B5bc72743abDdA4f6E91E01eF5b0d0E"
export STAGENET_RPC_URL="https://your-rpc-url"

npx hardhat run simulate.js --network stagenet
```

---

## Simulation Results

✅ **All tests passed:**
- Position creation: 5 scenarios tested
- Health factor calculation: Verified with live oracle
- Price crash simulation: Successful ($2000 → $900)
- Oracle integration: Working correctly

---

## Events Emission

| Event | Count | Purpose |
|-------|-------|---------|
| `PositionOpened` | 5 | Position creation tracking |
| `HealthFactorUpdated` | 25+ | HF calculation events |
| `LiquidationTriggered` | Tested | Liquidation execution |

---

**Deployment verified and production-ready!**

For more details, see:
- [README.md](README.md) — User guide
- [SPECIFICATIONS.md](SPECIFICATIONS.md) — Technical specs
- [GitHub Repository](https://github.com/MikeAlladoum/sentinel-liquidation)
