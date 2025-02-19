import { defineChain, http } from 'viem';
import { createConfig } from 'wagmi';

const u2u = {
  testnet: {
    rpc: 'https://rpc-nebulas-testnet.u2u.xyz',
    name: 'U2U',
    network: 'U2U Nebulas Testnet',
    explorer: 'https://testnet.u2uscan.xyz',
    chainId: 2484,
    currencySymbol: 'U2U',
  },

  mainnet: {
    chainId: 39,
    name: 'U2U',
    network: 'U2U Solaris Mainnet',
    rpc: 'https://rpc-mainnet.u2u.xyz',
    explorer: 'https://u2uscan.xyz',
    currencySymbol: 'U2U',
  },
};

const { chainId, name, currencySymbol, rpc, explorer } = u2u.testnet;

export const u2uNetWork = defineChain({
  id: chainId,
  name,
  nativeCurrency: {
    name: currencySymbol,
    symbol: currencySymbol,
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [rpc] },
  },
  blockExplorers: {
    default: {
      name: 'Explorer',
      url: explorer,
    },
  },
});

export const wagmiConfig = createConfig({
  chains: [u2uNetWork],
  transports: {
    [u2uNetWork.id]: http(),
  },
});
