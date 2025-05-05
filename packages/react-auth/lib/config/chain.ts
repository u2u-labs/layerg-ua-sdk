export enum ChainName {
  BSC = 'BSC',
  U2U = 'U2U',
}

export const CHAINS = {
  testnet: {
    u2u: {
      rpc: 'https://rpc-nebulas-testnet.u2u.xyz',
      name: ChainName.U2U,
      network: 'U2U Nebulas Testnet',
      explorer: 'https://testnet.u2uscan.xyz/',
      chainId: 2484,
      currencySymbol: 'U2U',
    },
    bsc: {
      rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      name: ChainName.BSC,
      network: 'BSC Testnet',
      explorer: 'https://testnet.bscscan.com/',
      chainId: 97,
      currencySymbol: 'BNB',
    },
  },

  mainnet: {
    u2u: {
      rpc: 'https://rpc-mainnet.u2u.xyz',
      name: ChainName.U2U,
      network: 'U2U Solaris Mainnet',
      explorer: 'https://u2uscan.xyz/',
      chainId: 39,
      currencySymbol: 'U2U',
    },
    bsc: {
      rpc: 'https://bsc-dataseed.binance.org',
      name: ChainName.BSC,
      network: 'BNB Smart Chain',
      explorer: 'https://bscscan.com/',
      chainId: 56,
      currencySymbol: 'BNB',
    },
  },
};
