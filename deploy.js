// scripts/deploy.js
const hre = require("hardhat");
const { ethers } = hre;

// Adresse Chainlink ETH/USD sur Ethereum mainnet
const CHAINLINK_ETH_USD = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";

// Bonus liquidateur : 5% (500 basis points)
const LIQUIDATOR_BONUS_BPS = 500;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const Sentinel = await ethers.getContractFactory("LiquidationSentinel");
  const sentinel = await Sentinel.deploy(CHAINLINK_ETH_USD, LIQUIDATOR_BONUS_BPS);
  await sentinel.deployed();

  const address = sentinel.address;
  console.log("\nLiquidationSentinel deployed at:", address);
  console.log("Oracle:", CHAINLINK_ETH_USD);
  console.log("Liquidator bonus: 5%");

  console.log("\nSave this address for simulate.js:");
  console.log("SENTINEL_ADDRESS=" + address);
}

main().catch((e) => { console.error(e); process.exit(1); });
