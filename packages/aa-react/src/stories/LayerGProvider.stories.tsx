import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Fragment } from 'react';
import { useAccount, useConnect, useSignMessage, WagmiProvider } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import { LayerGProvider } from '../components';
import { useLogin } from '../hooks';
import { useAPIClient } from '../hooks/useAPIClient';
import {
  LOGIN_MESSAGE,
  ORIGIN,
  PRIVATE_KEY,
  PUBLIC_KEY,
} from './config/layerg';
import { wagmiConfig } from './config/wagmi';

const meta = {
  component: Fragment,
} satisfies Meta<typeof Fragment>;

export default meta;

type Story = StoryObj<typeof meta>;

const queryClient = new QueryClient();

const Component = () => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <LayerGProvider
          apiParams={{
            apiKey: PUBLIC_KEY,
            secretKey: PRIVATE_KEY,
            origin: ORIGIN,
          }}
        >
          <ConnectButton />
        </LayerGProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

const ConnectButton = () => {
  const account = useAccount();
  const apiClient = useAPIClient();
  const { connectAsync } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const login = useLogin();

  return (
    <button
      onClick={async () => {
        if (!apiClient) return;

        if (!account.address) {
          await connectAsync({ connector: metaMask() });
        }

        const signature = await signMessageAsync({ message: LOGIN_MESSAGE });

        const data = await login({ signature, signer: account.address! });
        console.log(data);
      }}
    >
      Connect
    </button>
  );
};

export const Primary: Story = {
  render: () => <Component />,
};
