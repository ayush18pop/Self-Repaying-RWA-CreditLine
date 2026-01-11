import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ignition";
import "@nomicfoundation/hardhat-ignition-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@nomicfoundation/hardhat-network-helpers";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    mantleSepolia: {
      url: process.env.MANTLE_SEPOLIA_RPC_URL || "https://rpc.sepolia.mantle.xyz",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 5003
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },
  etherscan: {
    apiKey: {
      mantleSepolia: process.env.MANTLESCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "mantleSepolia",
        chainId: 5003,
        urls: {
          apiURL: "https://sepolia.mantlescan.xyz/api",
          browserURL: "https://sepolia.mantlescan.xyz"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  }
};

export default config;
