import { JsonRpcProvider } from '@ethersproject/providers'
import { ClientConfig } from './ClientConfig'
import { ERC4337EthersProvider } from './ERC4337EthersProvider'
import { HttpRpcClient } from './HttpRpcClient'
import { Signer } from '@ethersproject/abstract-signer'
import { IEntryPoint__factory } from '@layerg-ua-sdk/aa-utils'
import { GAccountAPI, GAccountApiParams } from './GAccountAPI'

/**
 * wrap an existing provider to tunnel requests through Account Abstraction.
 * @param originalProvider the normal provider
 * @param config see ClientConfig for more info
 * @param originalSigner use this signer as the owner. of this wallet. By default, use the provider's signer
 */
export async function wrapGProvider (
  originalProvider: JsonRpcProvider,
  config: ClientConfig,
  originalSigner: Signer = originalProvider.getSigner()
): Promise<ERC4337EthersProvider> {
  const entryPoint = IEntryPoint__factory.connect(config.entryPointAddress, originalProvider)

  const gAccountconfig: GAccountApiParams = {
    owner: originalSigner,
    provider: originalProvider,
    entryPointAddress: config.entryPointAddress,
    accountAddress: config.walletAddress,
    paymasterAPI: config.paymasterAPI,
    factoryAddress: config.factoryAddress
  }
  const gAccountAPI = await new GAccountAPI(gAccountconfig)

  const chainId = await originalProvider.getNetwork().then(net => net.chainId)
  const httpRpcClient = new HttpRpcClient(config.bundlerUrl, config.entryPointAddress, chainId)
  return await new ERC4337EthersProvider(
    chainId,
    config,
    originalSigner,
    originalProvider,
    httpRpcClient,
    entryPoint,
    gAccountAPI
  ).init()
}
