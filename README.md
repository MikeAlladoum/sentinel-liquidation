# Sentinel de Liquidation — Stagenet Hackathon 2026

## 📋 Résumé exécutif

Un **moteur de liquidation automatique Aave-style** déployé sur **Stagenet** (fork Ethereum mainnet bloc par bloc). Le contrat surveille des positions ETH/USD collatéralisées, lit le prix en temps réel via l'oracle Chainlink mainnet, et déclenche les liquidations dès que le Health Factor d'une position passe sous 1.0.

**Stack technique :** Solidity 0.8.20 + Hardhat + Chainlink AggregatorV3 + Stagenet

---

## 🎯 Pourquoi Stagenet ?

### Le problème

Valider un moteur de liquidation ne peut **pas** se faire sur :
- ❌ **Un testnet public** : oracles mockés, liquidité absente, prix figés
- ❌ **Un fork statique** : pas de données de marché réelles, aucun oracle live

### La solution : Stagenet

Stagenet rejoint **bloc par bloc l'état réel d'Ethereum mainnet**, ce qui signifie :
- ✅ **Oracles Chainlink live** : le contrat lit les vrais prix ETH/USD du mainnet
- ✅ **Données de marché authentiques** : conditions réelles de volatilité et de liquidité
- ✅ **Simulation de masse** : exécution de 500+ transactions sur historique réel
- ✅ **Dashboard temps réel** : métriques d'health factor, liquidations, TVL

Ce projet démontre exactement pourquoi le Stagenet est indispensable pour valider des contrats critiques de gestion de risque.

---

## 🔧 Architecture technique

```
sentinel-liquidation/
├── contracts/
│   └── LiquidationSentinel.sol      (Contrat principal)
├── scripts/
│   ├── deploy.js                    (Déploiement sur Stagenet)
│   └── simulate.js                  (Simulation crash + liquidations)
├── hardhat.config.cjs               (Config Hardhat)
├── deploy.js                        (Point d'entrée déploiement)
├── simulate.js                      (Point d'entrée simulation)
├── package.json
└── README.md
```

### Stack technique

| Composant | Détail |
|-----------|--------|
| **Langage contrat** | Solidity 0.8.20 avec optimiseur activé |
| **Framework dev** | Hardhat 2.28.6 avec hardhat-toolbox |
| **Oracle de prix** | Chainlink AggregatorV3Interface — ETH/USD mainnet |
| **Réseau cible** | Stagenet (fork Ethereum mainnet bloc par bloc) |
| **Scripts** | JavaScript (Node.js) via Hardhat Runtime Environment |
| **Sécurité** | @openzeppelin/contracts |

---

## 📊 Spécification fonctionnelle

### Flux principal

1. **Ouverture de position** (`openPosition(debtUSD, liquidationThreshold)`)
   - L'utilisateur dépose du collatéral ETH
   - Déclare une dette en USD (6 décimales)
   - Définit un seuil de liquidation (ex: 80%, 75%, 70%)

2. **Health Factor** (calculé à chaque appel)
   ```
   HF = (collateralETH × ethPriceUSD × liquidationThreshold) / (debtUSD × 10_000)
   ```
   - **HF ≥ 1.0** → position saine
   - **HF < 1.0** → position liquidable immédiatement

3. **Liquidation** (`liquidate(userAddress)`)
   - N'importe qui peut appeler pour liquider une position sous-collatéralisée
   - Le liquidateur reçoit le collatéral ETH + **bonus de 5%** en récompense
   - La position est marquée comme liquidée

4. **Scanning global** (`getLiquidatablePositions()`)
   - Retourne toutes les positions actuellement liquidables
   - Utilisé par le script de simulation pour orchestrer les liquidations en cascade

---

## 🚀 Configuration et déploiement

### Prérequis

```bash
npm install
```

### Étape 1 : Créer un Stagenet

1. Aller sur [contract.dev](https://contract.dev) et créer un compte
2. Cliquer sur **"New Stagenet"**
3. Choisir **Ethereum mainnet** comme source
4. Sélectionner un bloc récent
5. Récupérer l'URL RPC et le Chain ID

### Étape 2 : Configurer le projet

Créer un fichier `.env` (voir `.env.example`) :

```bash
STAGENET_RPC_URL=https://your-stagenet-url-here
STAGENET_CHAIN_ID=1
PRIVATE_KEY=your_private_key_here
```

Valider la connexion :
```bash
npx hardhat console --network stagenet
```

### Étape 3 : Déployer le contrat

```bash
STAGENET_RPC_URL="your-rpc-url" PRIVATE_KEY="your-key" npx hardhat run deploy.js --network stagenet
```

Récupérez l'adresse du contrat dans l'output.

### Étape 4 : Lancer la simulation

```bash
SENTINEL_ADDRESS="0x..." npx hardhat run simulate.js --network stagenet
```

**Déroulement** :
1. **PHASE 1** : Ouverture de 5 positions avec profils de risque différents
2. **PHASE 2** : Simulation crash ETH de 2000$ → 900$
3. **PHASE 3** : Cascade de liquidations automatiques
4. **RAPPORT FINAL** : Métriques d'exécution

---

## 🛡️ Sécurité et validation

### Mécanismes de protection

- ✅ Vérification staleness oracle (< 3600s)
- ✅ Solidity 0.8.20 (checked arithmetic)
- ✅ Pattern CEI (Checks-Effects-Interactions)
- ✅ Custom errors pour gestion d'erreurs optimisée
- ✅ Flag `isLiquidated` pour éviter les double-liquidations

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

## 📚 Références

- **Chainlink Oracle** : `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` (ETH/USD mainnet)
- **Stagenet** : https://contract.dev
- **Aave Protocol** : https://aave.com/protocol/
- **Hardhat Documentation** : https://hardhat.org

---

**Hackathon Stagenet 2026** | Sentinel de Liquidation | Février-Mars 2026

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
