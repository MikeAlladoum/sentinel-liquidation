// scripts/simulate.js
// Simule :
//  1. Ouverture de N positions avec des ratios de collatéral différents
//  2. Un crash progressif du prix ETH via manipulation de l'oracle (Stagenet)
//  3. La cascade de liquidations automatiques
//  4. Un rapport final des métriques

const hre = require("hardhat");
const { ethers } = hre;

// ── Config ──────────────────────────────────────────────────

const SENTINEL_ADDRESS = process.env.SENTINEL_ADDRESS || "0xVOTRE_ADRESSE_ICI";
const CHAINLINK_ETH_USD = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";

// Positions à créer : [collateralETH, debtUSD_en_dollars, threshold_bps]
// Ratio initial : ETH ~2000$ → position saine si collateral > dette/price
const POSITIONS = [
  { eth: "1.0",  debtUSD: 1200e6, threshold: 8000, label: "Conservative 80%"  },
  { eth: "0.5",  debtUSD:  800e6, threshold: 8000, label: "Tight 80%"         },
  { eth: "0.3",  debtUSD:  500e6, threshold: 7500, label: "Risky 75%"         },
  { eth: "0.2",  debtUSD:  380e6, threshold: 7000, label: "Danger zone 70%"   },
  { eth: "0.1",  debtUSD:  180e6, threshold: 8500, label: "Tiny 85%"          },
];

// Crash progressif : on simule une baisse du prix ETH par palliers
const PRICE_CRASH_STEPS = [
  { priceUSD: 2000, label: "Prix initial"       },
  { priceUSD: 1800, label: "Baisse -10%"        },
  { priceUSD: 1500, label: "Baisse -25%"        },
  { priceUSD: 1200, label: "Crash -40%"         },
  { priceUSD:  900, label: "Crash sévère -55%"  },
];

// ── Helpers ──────────────────────────────────────────────────

function formatHF(hfBigInt) {
  const hf = Number(hfBigInt) / 1e18;
  return hf.toFixed(4);
}

function formatETH(wei) {
  return ethers.utils.formatEther(wei);
}

// Manipule le slot de stockage de l'oracle Chainlink sur le Stagenet
// pour simuler un prix différent (impersonation + storage override)
async function overrideOraclePrice(priceUSD) {
  // Chainlink AggregatorV3 stocke la réponse dans un mapping de rounds
  // Sur le Stagenet, on peut overrider le storage directement
  const priceWith8Dec = BigInt(priceUSD) * BigInt(1e8);

  // On utilise hardhat_setStorageAt pour forcer un nouveau prix
  // Slot 1 du contrat Chainlink = latestAnswer (simplifié pour la démo)
  // En production Stagenet, utiliser l'API de manipulation de storage dédiée
  const hexPrice = "0x" + priceWith8Dec.toString(16).padStart(64, "0");
  await hre.network.provider.send("hardhat_setStorageAt", [
    CHAINLINK_ETH_USD,
    "0x1", // slot approximatif de latestAnswer
    hexPrice,
  ]);

  // Avancer d'un bloc pour que le timestamp soit à jour
  await hre.network.provider.send("evm_mine");
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const signers = await ethers.getSigners();
  const [deployer, ...users] = signers;

  console.log("\n========================================");
  console.log("  SENTINEL DE LIQUIDATION — Simulation");
  console.log("========================================\n");

  const Sentinel = await ethers.getContractAt(
    "LiquidationSentinel",
    SENTINEL_ADDRESS
  );

  // ── PHASE 1 : Ouvrir les positions ──────────────────────

  console.log("PHASE 1 — Ouverture des positions\n");

  for (let i = 0; i < POSITIONS.length; i++) {
    const cfg = POSITIONS[i];
    const user = users[i] || deployer;

    // Alimenter le user avec de l'ETH si nécessaire (Stagenet faucet auto)
    const balance = await ethers.provider.getBalance(user.address);
    if (balance < ethers.utils.parseEther("2")) {
      await hre.network.provider.send("hardhat_setBalance", [
        user.address,
        ethers.utils.toBeHex(ethers.utils.parseEther("10")),
      ]);
    }

    const sentinel = Sentinel.connect(user);
    const collateral = ethers.utils.parseEther(cfg.eth);

    try {
      const tx = await sentinel.openPosition(
        BigInt(cfg.debtUSD),
        cfg.threshold,
        { value: collateral }
      );
      await tx.wait();

      const [hf] = await sentinel.getHealthFactor(user.address);
      console.log(`  [${cfg.label}]`);
      console.log(`    User: ${user.address.slice(0, 10)}...`);
      console.log(`    Collatéral: ${cfg.eth} ETH | Dette: ${cfg.debtUSD / 1e6}$`);
      console.log(`    Health Factor: ${formatHF(hf)}\n`);
    } catch (e) {
      console.log(`  Erreur pour ${cfg.label}: ${e.message}\n`);
    }
  }

  const totalPositions = await Sentinel.getTotalPositions();
  console.log(`Total positions ouvertes: ${totalPositions}\n`);

  // ── PHASE 2 : Simuler le crash de prix ──────────────────

  console.log("PHASE 2 — Simulation du crash ETH\n");

  const results = [];

  for (const step of PRICE_CRASH_STEPS) {
    console.log(`ETH/USD = ${step.priceUSD}$ — ${step.label}`);

    // Override le prix oracle sur le Stagenet
    await overrideOraclePrice(step.priceUSD);

    // Scanner toutes les positions
    let liquidatableCount = 0;
    const stepData = { price: step.priceUSD, label: step.label, positions: [] };

    for (let i = 0; i < POSITIONS.length; i++) {
      const user = users[i] || deployer;
      const pos = await Sentinel.positions(user.address);
      if (pos.isLiquidated) {
        stepData.positions.push({ label: POSITIONS[i].label, status: "LIQUIDÉE", hf: 0 });
        continue;
      }

      try {
        const [hf] = await Sentinel.getHealthFactor(user.address);
        const hfNum = Number(hf) / 1e18;
        const status = hfNum < 1 ? "LIQUIDABLE" : "saine";
        stepData.positions.push({ label: POSITIONS[i].label, status, hf: hfNum });
        if (hfNum < 1) liquidatableCount++;
        console.log(`  ${POSITIONS[i].label}: HF=${hfNum.toFixed(3)} [${status}]`);
      } catch (e) {
        console.log(`  Erreur HF pour ${POSITIONS[i].label}: ${e.message}`);
      }
    }

    // ── PHASE 3 : Déclencher les liquidations automatiques

    if (liquidatableCount > 0) {
      console.log(`\n  → ${liquidatableCount} position(s) liquidable(s) détectée(s)`);
      console.log("  → Déclenchement des liquidations...\n");

      for (let i = 0; i < POSITIONS.length; i++) {
        const user = users[i] || deployer;
        const pos = await Sentinel.positions(user.address);
        if (pos.isLiquidated) continue;

        try {
          const [hf] = await Sentinel.getHealthFactor(user.address);
          if (hf < BigInt(1e18)) {
            const tx = await Sentinel.connect(deployer).liquidate(user.address);
            const receipt = await tx.wait();

            // Trouver l'event LiquidationTriggered
            const event = receipt.logs.find(
              (l) => l.topics[0] === Sentinel.interface.getEvent("LiquidationTriggered").topicHash
            );
            if (event) {
              const decoded = Sentinel.interface.decodeEventLog("LiquidationTriggered", event.data, event.topics);
              console.log(`  LIQUIDATION: ${POSITIONS[i].label}`);
              console.log(`    Collatéral saisi: ${formatETH(decoded.collateralSeized)} ETH`);
              console.log(`    Dette remboursée: ${Number(decoded.debtRepaid) / 1e6}$`);
              console.log(`    Prix ETH: ${Number(decoded.ethPriceAtLiquidation) / 1e8}$\n`);
            }
          }
        } catch (e) {
          // Position déjà liquidée ou encore saine
        }
      }
    }

    results.push(stepData);
    console.log("");
  }

  // ── RAPPORT FINAL ────────────────────────────────────────

  console.log("========================================");
  console.log("  RAPPORT FINAL");
  console.log("========================================\n");

  const totalLiquidations = await Sentinel.totalLiquidations();
  console.log(`Total positions ouvertes  : ${totalPositions}`);
  console.log(`Total liquidations        : ${totalLiquidations}`);
  console.log(`Taux de liquidation       : ${(Number(totalLiquidations) / Number(totalPositions) * 100).toFixed(1)}%`);

  console.log("\nRécapitulatif par position:");
  for (let i = 0; i < POSITIONS.length; i++) {
    const user = users[i] || deployer;
    const pos = await Sentinel.positions(user.address);
    console.log(`  ${POSITIONS[i].label}: ${pos.isLiquidated ? "LIQUIDÉE" : "active"}`);
  }

  console.log("\nSimulation terminée. Consultez le dashboard Stagenet pour les analytics.");
}

main().catch((e) => { console.error(e); process.exit(1); });
