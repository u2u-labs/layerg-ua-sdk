import { Provider } from '@ethersproject/providers'
import { PackedUserOperationStruct, SingletonPaymaster, SingletonPaymaster__factory, UserOperation } from '@layerg-ua-sdk/aa-utils'
import { BigNumber, BigNumberish, BytesLike } from 'ethers'

/**
 * returned paymaster parameters.
 * note that if a paymaster is specified, then the gasLimits must be specified
 * (even if postOp is not called, the paymasterPostOpGasLimit must be set to zero)
 */
export interface PaymasterParams {
  paymaster: string
  paymasterData?: BytesLike
  paymasterVerificationGasLimit: BigNumberish
  paymasterPostOpGasLimit: BigNumberish
}

export interface PaymasterApiParams {
  paymasterAddress?: string
  provider: Provider
}

/**
 * an API to external a UserOperation with paymaster info
 */
export class PaymasterAPI {

  paymasterAddress?: string
  paymaster?: SingletonPaymaster
  provider: Provider

  constructor(params: PaymasterApiParams) {
    this.paymasterAddress = params.paymasterAddress
    this.provider = params.provider
  }

  /**
   * return temporary values to put into the paymaster fields.
   * @param userOp the partially-filled UserOperation. Should be filled with tepmorary values for all
   *    fields except paymaster fields.
   * @return temporary paymaster parameters, that can be used for gas estimations
   */
  async getTemporaryPaymasterData(userOp: PackedUserOperationStruct): Promise<PaymasterParams | null> {
    return await this.getPaymasterData(userOp)
  }

  /**
   * after gas estimation, return final paymaster parameters to replace the above tepmorary value.
   * @param userOp a partially-filled UserOperation (without signature and paymasterAndData
   *  note that the "preVerificationGas" is incomplete: it can't account for the
   *  paymasterAndData value, which will only be returned by this method..
   * @returns the values to put into paymaster fields, null to leave them empty
   */
  async getPaymasterData(userOp: PackedUserOperationStruct): Promise<PaymasterParams | null> {
    if (this.paymaster == null) {
      if (this.paymasterAddress != null && this.paymasterAddress !== '') {
        this.paymaster = SingletonPaymaster__factory.connect(this.paymasterAddress, this.provider)
      } else {
        throw new Error('no paymaster to get hash')
      }
    }
    const hash = this.paymaster.interface.encodeFunctionData('getHash', [BigNumber.from(1), userOp])

    return {
      paymaster: this.paymasterAddress,
      paymasterData: hash,
      paymasterVerificationGasLimit: BigNumber.from(30000).toString(),
      paymasterPostOpGasLimit: "0x1"
    } as PaymasterParams
  }
}