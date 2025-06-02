import axios, { Method } from 'axios';
import clsx from 'clsx';
import { ButtonHTMLAttributes, FC, useMemo } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import {
  Connector,
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
} from 'wagmi';
import IconTelegram from '../assets/images/icon-telegram.webp';
import IconX from '../assets/images/icon-x.webp';
import '../assets/styles/login-ui.scss';
import IconGoogle from '../assets/svg/icon-google.svg';
import IconMetaMask from '../assets/svg/icon-metamask.svg';
import IconWalletConnect from '../assets/svg/icon-wallet-connect.svg';
import { useAuthProvider } from '../hooks/useAuth';

interface Props {
  title?: string;
  description?: string;
  className?: string;
  socialProviders?: ('google' | 'twitter' | 'github')[];
}

interface DataWallet {
  id: string;
  icon: string;
  type: 'wallet' | 'google' | 'twitter' | 'telegram';
  connector?: Connector;
  name?: string;
  deepLink?: string;
}

interface ButtonWalletProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  title: string;
}

const ButtonWallet: FC<ButtonWalletProps> = (props) => {
  const { icon, title, ...buttonProps } = props;

  return (
    <button
      type="button"
      {...buttonProps}
      className={clsx('layerg-login-ui-provider-btn', buttonProps.className)}
    >
      {/* Background */}
      <div className={clsx('layerg-login-ui-provider-btn-background')} />

      {/* Icon */}
      {icon && (
        <div className="layerg-login-ui-provider-btn-icon">
          <img src={icon} alt={title} />
        </div>
      )}

      {/* Content */}
      <div className="layerg-login-ui-provider-btn-content">
        <h4>{title}</h4>
        {/* <p className="text-sm">Using a browser extension</p> */}
      </div>
    </button>
  );
};

export const LoginUI = ({
  // socialProviders = ["google", "twitter", "github"],
  title = 'Sign in to your account',
  description = 'Select your Provider',
  className = '',
}: Props) => {
  const {
    apiKey,
    baseApiUrl,
    telegramAuthUrl,
    walletLogin,
    toggleLoading,
    setError,
  } = useAuthProvider();

  const { address, isConnected, connector: currentConnector } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync: onSignMessage } = useSignMessage();

  const listWallet = useMemo(() => {
    // let okxDeepLink = '';
    // let bitgetDeepLink = '';
    let metaMaskDeepLink = '';

    if (typeof window !== 'undefined') {
      const location = window.location;

      // okxDeepLink =
      //   'https://www.okx.com/download?deeplink=' +
      //   encodeURIComponent(
      //     'okx://wallet/dapp/url?dappUrl=' +
      //       encodeURIComponent(`${location.origin}/`),
      //   );

      // bitgetDeepLink = `bitkeep://bkconnect?action=dapp&url=${encodeURIComponent(`${location.origin}/`)}`;

      metaMaskDeepLink = `https://metamask.app.link/dapp/${location.origin}`;
    }

    let result: DataWallet[] = [
      {
        id: 'telegram',
        icon: IconTelegram,
        type: 'telegram',
        name: 'Login With Telegram',
      },
      {
        id: 'google',
        icon: IconGoogle,
        type: 'google',
        name: 'Login With Google',
      },
      {
        id: 'x',
        icon: IconX,
        type: 'twitter',
        name: 'Login With X',
      },
      // {
      //   id: 'injectedWallet',
      //   icon: <ImageBase.IconInjectedWallet className="w-full h-auto" />,
      //   type: 'wagmi',
      //   connector: connectors?.[1],
      //   name: 'Injected Wallet',
      // },
      {
        id: 'metaMask',
        icon: IconMetaMask,
        type: 'wallet',
        connector: connectors?.[0],
        name: 'MetaMask',
        deepLink: metaMaskDeepLink,
      },
      {
        id: 'walletConnect',
        icon: IconWalletConnect,
        type: 'wallet',
        connector: connectors?.[connectors.length - 1],
        name: 'WalletConnect',
      },
      // {
      //   id: walletConnectWallet({ projectId }).id,
      //   icon: <ImageBase.IconWalletConnect className="w-full h-auto" />,
      //   type: 'rainbow',
      // },
    ];

    // Use In Dapp
    if (isMobile || isTablet) {
      const ua = navigator.userAgent;

      const listDapp: string[] = [];
      result.forEach((item) => {
        let isInApp = false;
        switch (item.id) {
          // case okxWallet({ projectId }).id:
          //   isInApp = /OKApp/i.test(ua);
          //   break;
          // case bitgetWallet({ projectId }).id:
          //   isInApp = /BitKeep/i.test(ua);
          //   break;
          case 'metaMask':
            isInApp = /MetaMask/i.test(ua);
            break;

          default:
            break;
        }

        if (isInApp) {
          listDapp.push(item.id);
        }
      });

      // Use For U2U Wallet and Trust Wallet
      // if (window?.ethereum?.isTrust && listDapp.length === 0) {
      //   listDapp.push('injectedWallet');
      // }

      if (listDapp.length === 0) {
        listDapp.push(
          // 'injectedWallet',
          // 'walletConnect',
          'x',
          'telegram',
          'google',
          'wallet',
        );
        // listDapp.push('injectedWallet', walletConnectWallet({ projectId }).id);
      }

      result = result.filter((item) => listDapp.some((x) => x === item.id));
    }

    return result;
  }, [connectors, isMobile, isTablet]);

  const handleWalletLogin = async () => {
    try {
      toggleLoading(true);

      if (typeof window !== 'undefined') {
        const baseHeaders = {
          'x-api-key': apiKey,
          origin: window?.location?.origin,
        };

        // Get Signature Message
        const response = await axios<{
          success: boolean;
          data: { nonce: string; message: string; expiresIn: number };
          message: string;
        }>({
          baseURL: baseApiUrl,
          url: '/auth/web3/nonce',
          method: 'POST' as Method,
          headers: {
            ...baseHeaders,
          },
          data: {
            address,
          },
        });

        if (response.data?.success && response?.data?.data?.message) {
          await onSignMessage(
            { message: response.data.data.message },
            {
              onSuccess: async (data) => {
                if (data && address) {
                  // Login
                  await walletLogin({ address, message: data });
                }
              },
              onError: (error) => {
                setError(error);
                throw error;
              },
            },
          );
        } else {
          throw new Error('Verify address Error');
        }
      }
    } catch (error: any) {
      setError(error);
      throw error;
    } finally {
      toggleLoading(false);
    }
  };

  return (
    // <div className={`flex items-center justify-center ${customClassName}`}>
    <div className={clsx('layerg-login-ui-block', className)}>
      <div className="layerg-login-ui-header">
        <h3 className="layerg-login-ui-header-title">{title}</h3>

        <p>{description}</p>
      </div>

      <div className="layerg-login-ui-provider-block">
        <div className="layerg-login-ui-provider-content">
          {listWallet.map((item) => {
            const key = `wallet-${item.id}`;
            const { icon, type } = item;

            switch (type) {
              case 'google':
              case 'twitter': {
                return (
                  <ButtonWallet
                    key={key}
                    title={item.name ?? ''}
                    icon={icon}
                    // disabled={mutationGenerateProviderAuth.isPending}
                    onClick={async () => {
                      try {
                        let urlCall = `/auth/${type}`;
                        let method: Method = 'GET';

                        const headers = {
                          'x-api-key': apiKey,
                          origin: window?.location?.origin,
                        };

                        axios({
                          baseURL: baseApiUrl,
                          url: urlCall,
                          method,
                          headers,
                        }).then((res) => {
                          if (res.headers?.location) {
                            window.open(res.headers?.location, '_self');
                          }
                        });
                      } catch (error) {
                        console.error('Provider Authenticate Error: ', error);
                      }
                    }}
                  />
                );
              }

              case 'telegram': {
                if (telegramAuthUrl) {
                  return (
                    <ButtonWallet
                      key={key}
                      title={item.name ?? ''}
                      icon={icon}
                      onClick={async () => {
                        window.open(telegramAuthUrl, '_self');
                      }}
                    />
                  );
                } else {
                  return '';
                }
              }

              case 'wallet': {
                return (
                  <ButtonWallet
                    key={key}
                    title={item.name ?? ''}
                    icon={icon}
                    onClick={async () => {
                      if (item.connector) {
                        if (
                          isConnected &&
                          address &&
                          currentConnector &&
                          currentConnector.uid === item.connector.uid
                        ) {
                          await handleWalletLogin();
                        } else {
                          if ((isMobile || isTablet) && item.deepLink) {
                            let isInApp = false;
                            const ua = navigator.userAgent;

                            switch (item.id) {
                              case 'metaMask':
                                isInApp = /MetaMask/i.test(ua);
                                break;
                              default:
                                break;
                            }

                            if (!isInApp) {
                              window.open(item.deepLink, '_blank');
                              return;
                            }
                          }

                          await disconnectAsync({
                            connector: item.connector,
                          });

                          await connectAsync(
                            { connector: item.connector },
                            {
                              onSuccess: async () => {
                                if (address) {
                                  await handleWalletLogin();
                                }
                              },
                            },
                          );
                        }
                      }
                    }}
                  />
                );
              }

              default:
                return '';
            }
          })}
        </div>
      </div>
      {/* {logoUrl && (
          <div className="flex justify-center">
            <img src={logoUrl} alt="Logo" className="h-12" />
          </div>
        )}

        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
          {onCreateAccount && (
            <p className="mt-2 text-sm text-gray-600">
              Or{" "}
              <button
                type="button"
                onClick={onCreateAccount}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                create a new account
              </button>
            </p>
          )}
        </div>

        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 text-red-500"
              >
                Email addressfdfsfds
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a10.025 10.025 0 011.57-3.029m4.858 1.104a4.002 4.002 0 015.367 5.367M18.825 13.875A10.036 10.036 0 0121.544 12c-1.274-4.057-5.064-7-9.544-7-1.098 0-2.158.18-3.147.5a9.94 9.94 0 00-3.029 1.571m2.146 2.146l-4.95 4.95M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {showRememberMe && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="remember-me"
                  className="block ml-2 text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>
            )}

            {onForgotPassword && (
              <div className="text-sm">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <svg className="w-5 h-5 mr-3 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
              ) : null}
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        {showSocialLogin && socialProviders.length > 0 && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-500 bg-white">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">
              {socialProviders.map(
                (provider: any) =>
                  socialIcons[provider] && (
                    <button
                      key={provider}
                      type="button"
                      className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      {socialIcons[provider]}
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </button>
                  )
              )}
            </div>
          </div>
        )} */}
    </div>
  );
};
