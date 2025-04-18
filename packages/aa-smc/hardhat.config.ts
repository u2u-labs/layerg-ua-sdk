import "@nomiclabs/hardhat-ethers";
require('dotenv').config()
require("hardhat-contract-sizer");
import "@typechain/hardhat";
import "@nomiclabs/hardhat-etherscan";

const config: any = {
  solidity: {
    version: "0.8.19",
    typechain: {
      target: "ethers-v5", // Ensures compatibility with ethers v5
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true,

    },
  },
  // contractSizer: {
  //   alphaSort: true,
  //   disambiguatePaths: false,
  //   runOnCompile: true,
  //   strict: true,
  // },
  etherscan: {
    apiKey: "RX2H5QQVMY18Q49HDBDC9UTDWES1VNSHEZ",
    customChains: [
      {
        network: "solaris",
        chainId: 39,
        urls: {
          apiURL: "https://u2uscan.xyz/api",
          browserURL: "https://u2uscan.xyz"
        }
      },
      {
        network: "nebulas",
        chainId: 2484,
        urls: {
          apiURL: "https://testnet.u2uscan.xyz/api",
          browserURL: "https://testnet.u2uscan.xyz"
        }
      },
      {
        network: "a8Testnet",
        chainId: 28122024,
        urls: {
          apiURL: "https://scanv2-testnet.ancient8.gg/api",
          browserURL: "https://scanv2-testnet.ancient8.gg"
        }
      }
    ]
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
    solaris: {
      url: 'https://rpc-mainnet.u2u.xyz/',
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
    nebulas: {
      url: 'https://rpc-nebulas-testnet.uniultra.xyz/',
      accounts: [
        `${process.env.PRIVATE_KEY}`
      ]
    },
    a8Testnet: {
      url: 'https://rpcv2-testnet.ancient8.gg',
      accounts: [
        `${process.env.PRIVATE_KEY}`
      ]
    },
  },
  defaultNetwork: "hardhat"
};

export default config;

