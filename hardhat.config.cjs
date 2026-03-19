require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.STAGENET_RPC_URL || "https://mainnet.infura.io/v3/YOUR_KEY",
      },
    },
    stagenet: {
      url: process.env.STAGENET_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 14932,
    },
  },
};
