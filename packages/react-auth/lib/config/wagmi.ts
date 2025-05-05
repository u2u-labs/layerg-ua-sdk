import { defineChain, http } from 'viem';
import { createConfig, injected } from 'wagmi';
import { metaMask, walletConnect } from 'wagmi/connectors';
import { CHAINS } from './chain';

export const mainChain = CHAINS['testnet'];

export const u2uNetWork = defineChain({
  id: mainChain.u2u.chainId,
  caipNetworkId: `eip155:${mainChain.u2u.chainId}`,
  chainNamespace: 'eip155',
  name: mainChain.u2u.network,
  nativeCurrency: {
    name: mainChain.u2u.currencySymbol,
    symbol: mainChain.u2u.currencySymbol,
    decimals: 18,
  },

  rpcUrls: {
    default: { http: [mainChain.u2u.rpc] },
  },
  blockExplorers: {
    default: {
      name: 'Explorer',
      url: mainChain.u2u.explorer,
    },
  },
  contracts: {
    // Add the contracts here
  },
});

export const bscNetWork = defineChain({
  id: mainChain.bsc.chainId,
  caipNetworkId: `eip155:${mainChain.bsc.chainId}`,
  chainNamespace: 'eip155',
  name: mainChain.bsc.network,
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },

  rpcUrls: {
    default: { http: [mainChain.bsc.rpc] },
  },
  blockExplorers: {
    default: {
      name: 'Explorer',
      url: mainChain.bsc.explorer,
    },
  },
  contracts: {
    // Add the contracts here
  },
});

// export const tronNetWork = defineChain({
//   id: mainChain.tron.chainId,
//   caipNetworkId: `eip155:${mainChain.tron.chainId}`,
//   chainNamespace: 'eip155',
//   name: mainChain.tron.network,
//   nativeCurrency: { name: 'TRON', symbol: 'TRX', decimals: 18 },

//   rpcUrls: {
//     default: { http: [mainChain.tron.rpc] },
//   },
//   blockExplorers: {
//     default: {
//       name: 'Explorer',
//       url: mainChain.tron.explorer,
//     },
//   },
//   contracts: {
//     // Add the contracts here
//   },
// });

export const projectId = '2fe75ae14e2364797df8ef3558b58cc7';

if (!projectId) {
  throw new Error('Project ID is not defined');
}
// const appName = 'UPhone';

// const connectors = connectorsForWallets(
//   [
//     {
//       groupName: 'Main',
//       wallets: [
//         // metaMaskWallet,
//         // trustWallet,
//         // () => okxWallet({ projectId }),
//         // bitgetWallet,
//         walletConnectWallet,
//         // injectedWallet,
//       ],
//     },
//   ],
//   {
//     projectId,
//     appName,
//   },
// );

const wagmiConfig = createConfig({
  connectors: [
    // ...(isMobile ? [metaMask()] : []),
    metaMask(),
    injected(),
    // ...connectors,
    walletConnect({ projectId }),
  ],
  multiInjectedProviderDiscovery: false,
  chains: [
    u2uNetWork,
    // bscNetWork,
    // tronNetWork
  ],
  ccipRead: false,
  transports: {
    [u2uNetWork.id]: http(),
    // [bscNetWork.id]: http(),
    // [tronNetWork.id]: http(),
  },
  ssr: true,
});

export default wagmiConfig;
