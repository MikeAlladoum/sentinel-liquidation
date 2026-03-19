// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// =============================================================
//  LiquidationSentinel — Stagenet Hackathon
//  Surveille des positions collatéralisées et déclenche
//  la liquidation automatiquement quand HF < 1.0
// =============================================================

interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function decimals() external view returns (uint8);
}

contract LiquidationSentinel {

    // ── Types ───────────────────────────────────────────────

    struct Position {
        address owner;
        uint256 collateralETH;    // montant ETH déposé (en wei)
        uint256 debtUSD;          // dette en USD (6 décimales)
        uint256 liquidationThreshold; // ex: 8000 = 80%
        bool    isLiquidated;
        bool    exists;
    }

    // ── State ────────────────────────────────────────────────

    AggregatorV3Interface public immutable ethUsdOracle;

    mapping(address => Position) public positions;
    address[] public positionOwners;

    uint256 public totalLiquidations;
    uint256 public liquidatorBonus; // en basis points (ex: 500 = 5%)

    address public owner;

    // ── Events ───────────────────────────────────────────────

    event PositionOpened(
        address indexed user,
        uint256 collateralETH,
        uint256 debtUSD,
        uint256 liquidationThreshold
    );

    event HealthFactorUpdated(
        address indexed user,
        uint256 healthFactor,  // x1e18
        uint256 ethPriceUSD    // x1e8 (Chainlink format)
    );

    event LiquidationTriggered(
        address indexed user,
        address indexed liquidator,
        uint256 collateralSeized, // en wei ETH
        uint256 debtRepaid,       // en USD (6 dec)
        uint256 ethPriceAtLiquidation
    );

    // ── Errors ───────────────────────────────────────────────

    error PositionAlreadyExists();
    error PositionNotFound();
    error PositionAlreadyLiquidated();
    error PositionStillHealthy(uint256 currentHF);
    error InvalidCollateral();
    error InvalidDebt();
    error OracleStalePrice(uint256 updatedAt);

    // ── Constructor ──────────────────────────────────────────

    constructor(address _ethUsdOracle, uint256 _liquidatorBonus) {
        // Adresse Chainlink ETH/USD sur Ethereum mainnet :
        // 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
        ethUsdOracle   = AggregatorV3Interface(_ethUsdOracle);
        liquidatorBonus = _liquidatorBonus; // ex: 500 = 5%
        owner          = msg.sender;
    }

    // ── Core logic ───────────────────────────────────────────

    /// @notice Ouvre une position avec du collatéral ETH et une dette USD
    /// @param debtUSD montant emprunté en USD avec 6 décimales (ex: 1000e6 = 1000$)
    /// @param liquidationThreshold seuil en bps (ex: 8000 = 80%)
    function openPosition(uint256 debtUSD, uint256 liquidationThreshold) external payable {
        if (msg.value == 0)                 revert InvalidCollateral();
        if (debtUSD == 0)                   revert InvalidDebt();

        // Créer ou remplacer la position
        bool isNew = !positions[msg.sender].exists;
        
        positions[msg.sender] = Position({
            owner:                msg.sender,
            collateralETH:        msg.value,
            debtUSD:              debtUSD,
            liquidationThreshold: liquidationThreshold,
            isLiquidated:         false,
            exists:               true
        });

        if (isNew) {
            positionOwners.push(msg.sender);
        }

        emit PositionOpened(msg.sender, msg.value, debtUSD, liquidationThreshold);
    }

    /// @notice Calcule le health factor d'une position (x1e18)
    /// @dev HF = (collateralUSD * liquidationThreshold) / (debtUSD * 10000)
    ///      HF < 1e18 → position liquidable
    function getHealthFactor(address user) public view returns (uint256 hf, uint256 ethPrice) {
        Position storage pos = positions[user];
        if (!pos.exists) revert PositionNotFound();

        ethPrice = _getETHPrice();

        // collateralUSD en 6 décimales (même unité que debtUSD)
        // ethPrice en 8 dec (Chainlink), collateralETH en 18 dec (wei)
        // → collateralUSD = collateralETH * ethPrice / 1e(18+8-6) = / 1e20
        uint256 collateralUSD = (pos.collateralETH * ethPrice) / 1e20;

        // HF = (collateralUSD * threshold / 10000) / debtUSD  — mis à l'échelle x1e18
        hf = (collateralUSD * pos.liquidationThreshold * 1e18) / (pos.debtUSD * 10_000);
    }

    /// @notice Tente de liquider une position si HF < 1.0
    /// @dev Appelé par un liquidateur externe (bot ou script de simulation)
    function liquidate(address user) external {
        Position storage pos = positions[user];

        if (!pos.exists)        revert PositionNotFound();
        if (pos.isLiquidated)   revert PositionAlreadyLiquidated();

        (uint256 hf, uint256 ethPrice) = getHealthFactor(user);

        // HF doit être inférieur à 1.0 (= 1e18)
        if (hf >= 1e18) revert PositionStillHealthy(hf);

        // Calculer le bonus liquidateur
        uint256 collateralToSeize = pos.collateralETH;
        uint256 bonus = (collateralToSeize * liquidatorBonus) / 10_000;
        uint256 liquidatorAmount = collateralToSeize + bonus > address(this).balance
            ? address(this).balance
            : collateralToSeize; // sécurité: ne pas dépasser le solde

        pos.isLiquidated = true;
        totalLiquidations++;

        emit LiquidationTriggered(
            user,
            msg.sender,
            liquidatorAmount,
            pos.debtUSD,
            ethPrice
        );

        // Transférer le collatéral au liquidateur
        (bool sent, ) = payable(msg.sender).call{value: liquidatorAmount}("");
        require(sent, "ETH transfer failed");
    }

    /// @notice Scanne toutes les positions et retourne celles qui sont liquidables
    function getLiquidatablePositions()
        external
        view
        returns (address[] memory liquidatable, uint256[] memory healthFactors)
    {
        uint256 count = 0;
        uint256 n = positionOwners.length;

        uint256[] memory tempHFs = new uint256[](n);
        address[] memory tempAddrs = new address[](n);

        for (uint256 i = 0; i < n; i++) {
            address u = positionOwners[i];
            if (positions[u].isLiquidated) continue;

            (uint256 hf, ) = getHealthFactor(u);
            if (hf < 1e18) {
                tempAddrs[count] = u;
                tempHFs[count]   = hf;
                count++;
            }
        }

        liquidatable  = new address[](count);
        healthFactors = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            liquidatable[i]  = tempAddrs[i];
            healthFactors[i] = tempHFs[i];
        }
    }

    /// @notice Retourne le nombre total de positions ouvertes
    function getTotalPositions() external view returns (uint256) {
        return positionOwners.length;
    }

    // ── Internal ─────────────────────────────────────────────

    function _getETHPrice() internal view returns (uint256) {
        (
            ,
            int256 answer,
            ,
            uint256 updatedAt,

        ) = ethUsdOracle.latestRoundData();

        // Vérifie que le prix n'est pas trop vieux (> 1h)
        if (block.timestamp - updatedAt > 3600) {
            revert OracleStalePrice(updatedAt);
        }

        return uint256(answer); // 8 décimales Chainlink
    }

    // ── Admin ────────────────────────────────────────────────

    /// @notice Reçoit de l'ETH (pour alimenter le contrat en récompenses)
    receive() external payable {}
}
