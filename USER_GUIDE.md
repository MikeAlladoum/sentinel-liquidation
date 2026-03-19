# User Guide — Sentinel de Liquidation

## Quick Start

### Prerequisites
```bash
git clone https://github.com/MikeAlladoum/sentinel-liquidation.git
cd sentinel-liquidation
npm install
```

### Deploy Your Own Instance

```bash
export STAGENET_RPC_URL="https://rpc.contract.dev/YOUR_RPC_URL"
export STAGENET_CHAIN_ID="14932"
export PRIVATE_KEY="your_private_key"

npx hardhat run deploy.js --network stagenet
```

### Use Existing Contract

**Contract Address:** `0x230162A10B5bc72743abDdA4f6E91E01eF5b0d0E`

---

## Smart Contract Interface

### Open Position

```solidity
function openPosition(uint256 debtUSD, uint256 liquidationThreshold) external payable
```

**Parameters:**
- `debtUSD`: USD debt in 6 decimals (e.g., `1000e6` = $1000)
- `liquidationThreshold`: Risk threshold in BPS (e.g., `8000` = 80%)

**Example:**
```javascript
const tx = await sentinel.openPosition(
  ethers.utils.parseUnits("1000", 6),  // $1000 debt
  8000,                                 // 80% threshold
  { value: ethers.utils.parseEther("1.0") } // 1 ETH collateral
);
await tx.wait();
```

### Get Health Factor

```solidity
function getHealthFactor(address user) 
  external view 
  returns (uint256 hf, uint256 ethPrice)
```

**Returns:**
- `hf`: Health factor (scaled x1e18)
- `ethPrice`: Current ETH price in USD (8 decimals from Chainlink)

**Example:**
```javascript
const [hf, ethPrice] = await sentinel.getHealthFactor(userAddress);
console.log(`HF: ${hf / 1e18}`);
console.log(`ETH Price: ${ethPrice / 1e8}`);
```

### Liquidate Position

```solidity
function liquidate(address user) external
```

**Requirements:**
- Position must exist
- Health Factor < 1.0
- Position must not already be liquidated

**Example:**
```javascript
const tx = await sentinel.liquidate(userAddress);
await tx.wait();
console.log("Liquidation executed!");
```

---

## Running the Simulation

```bash
export SENTINEL_ADDRESS="0x230162A10B5bc72743abDdA4f6E91E01eF5b0d0E"
export STAGENET_RPC_URL="https://your-rpc-url"

npx hardhat run simulate.js --network stagenet
```

**What it does:**
1. **PHASE 1:** Creates 5 test positions with different risk profiles
2. **PHASE 2:** Simulates ETH price crash from $2000 to $900
3. **PHASE 3:** Monitors health factors and triggers liquidations
4. **REPORT:** Shows final metrics and execution summary

---

## Health Factor Explanation

### Formula
```
HF = (collateralETH × ethPrice × threshold) / (debtUSD × 10,000)
```

### Interpretation
- **HF ≥ 1.0** → Position is SAFE (healthy)
- **0.5 < HF < 1.0** → Position is AT RISK
- **HF < 1.0** → Position is LIQUIDATABLE (immediately)

### Example Calculation

**Position Details:**
- Collateral: 1.0 ETH
- ETH Price: $2000
- Debt: $1200
- Threshold: 80% (8000 BPS)

**Calculation:**
```
HF = (1.0 × 2000 × 0.80) / 1200
HF = 1600 / 1200
HF = 1.33 (SAFE)
```

**After price drops to $1500:**
```
HF = (1.0 × 1500 × 0.80) / 1200
HF = 1200 / 1200
HF = 1.0 (AT THRESHOLD)
```

**After price drops to $1200:**
```
HF = (1.0 × 1200 × 0.80) / 1200
HF = 960 / 1200
HF = 0.8 (LIQUIDATABLE!)
```

---

## Security Considerations

✅ **Oracle Staleness Check**
- Price older than 3600 seconds is rejected
- Prevents stale price manipulation

✅ **Decimal Precision**
- Chainlink: 8 decimals
- USD amounts: 6 decimals
- ETH amounts: 18 decimals (wei)

✅ **Double-Liquidation Prevention**
- Position marked `isLiquidated` after first liquidation
- Cannot liquidate twice

✅ **CEI Pattern**
- Checks performed before state changes
- Effects applied safely
- Interactions happen last

---

## Troubleshooting

### Error: "PositionNotFound"
→ Position doesn't exist for this user address

### Error: "PositionStillHealthy"
→ Health Factor ≥ 1.0, position cannot be liquidated yet

### Error: "OracleStalePrice"
→ Chainlink price is older than 3600 seconds (stale)

### Error: "PositionAlreadyLiquidated"
→ Position has already been liquidated once

---

## Advanced Usage

### Batch Monitor Liquidatable Positions

```javascript
const liquidatable = await sentinel.getLiquidatablePositions();
console.log(`${liquidatable.length} positions ready to liquidate`);

for (const userAddr of liquidatable) {
  const [hf, ethPrice] = await sentinel.getHealthFactor(userAddr);
  console.log(`${userAddr}: HF = ${hf / 1e18}`);
}
```

### Listen for Liquidation Events

```javascript
sentinel.on("LiquidationTriggered", (user, liquidator, collateral, debt, price) => {
  console.log(`Liquidation: ${user} by ${liquidator}`);
  console.log(`Collateral seized: ${ethers.utils.formatEther(collateral)} ETH`);
  console.log(`Debt repaid: ${debt / 1e6}$`);
});
```

---

## Resources

- **GitHub:** https://github.com/MikeAlladoum/sentinel-liquidation
- **Contract Address:** `0x230162A10B5bc72743abDdA4f6E91E01eF5b0d0E`
- **Chainlink Oracle:** `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419`
- **Stagenet RPC:** https://rpc.contract.dev/
- **Aave Protocol:** https://aave.com/
- **Chainlink Docs:** https://docs.chain.link/

---

**Happy testing on Stagenet!**
