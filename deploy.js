// scripts/deploy.js
const hre = require("hardhat");

// Adresse Chainlink ETH/USD sur Ethereum mainnet
const CHAINLINK_ETH_USD = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";

// Bonus liquidateur : 5% (500 basis points)
const LIQUIDATOR_BONUS_BPS = 500;

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying with:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  const Sentinel = await hre.ethers.getContractFactory("LiquidationSentinel");
  const sentinel = await Sentinel.deploy(CHAINLINK_ETH_USD, LIQUIDATOR_BONUS_BPS);
  await sentinel.waitForDeployment();

  const address = await sentinel.getAddress();
  console.log("\nLiquidationSentinel deployed at:", address);
  console.log("Oracle:", CHAINLINK_ETH_USD);
  console.log("Liquidator bonus: 5%");

  // Vérifier que l'oracle répond bien
  const [hf, ethPrice] = await sentinel.getHealthFactor(deployer.address).catch(() => [null, null]);
  const price = await hre.ethers.provider.call({
    to: CHAINLINK_ETH_USD,
    data: "0xfeaf968c", // latestRoundData()
  });
  console.log("\nOracle check: ETH/USD raw response length:", price.length);
  console.log("\nSave this address for simulate.js:");
  console.log("SENTINEL_ADDRESS=" + address);
}

main().catch((e) => { console.error(e); process.exit(1); });
