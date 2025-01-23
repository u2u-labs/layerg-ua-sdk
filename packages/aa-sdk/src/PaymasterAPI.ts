import { Provider } from '@ethersproject/providers'
import { PackedUserOperationStruct, UserOperation, VerifyingPaymaster, VerifyingPaymaster__factory, packUserOp } from '@layerg-ua-sdk/aa-utils'
import { BigNumber, BigNumberish, BytesLike, Signer, ethers } from 'ethers'
import { defaultAbiCoder, hexConcat } from 'ethers/lib/utils'

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
  paymaster?: VerifyingPaymaster
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
  async getTemporaryPaymasterData(userOp: Partial<UserOperation>, validUntil: string, validAfter: string, signer?: Signer): Promise<PaymasterParams | null> {
    const pack = packUserOp(this.toUserOperation(userOp))
    return await this.getPaymasterData(pack, validUntil, validAfter, signer)
  }

  /**
   * after gas estimation, return final paymaster parameters to replace the above tepmorary value.
   * @param userOp a partially-filled UserOperation (without signature and paymasterAndData
   *  note that the "preVerificationGas" is incomplete: it can't account for the
   *  paymasterAndData value, which will only be returned by this method..
   * @returns the values to put into paymaster fields, null to leave them empty
   */
  async getPaymasterData(userOp: PackedUserOperationStruct, validUntil: string, validAfter: string, signer?: Signer): Promise<PaymasterParams | null> {
    if (this.paymaster == null) {
      if (this.paymasterAddress != null && this.paymasterAddress !== '') {
        this.paymaster = VerifyingPaymaster__factory.connect(this.paymasterAddress, this.provider)
      } else {
        throw new Error('no paymaster to get hash')
      }
    }

    if (!signer) {
      throw new Error('signer not found')
    }

    const hash = this.paymaster.interface.encodeFunctionData('getHash', [userOp, validUntil, validAfter])
    const signature = await signer.signMessage(ethers.utils.arrayify(hash));
    const paymasterData = hexConcat([
      defaultAbiCoder.encode(['uint48', 'uint48'], [validUntil, validAfter]), // Encodes validUntil and validAfter
      signature, // Appends the signature
    ]);
    return {
      paymaster: this.paymasterAddress,
      paymasterData: paymasterData,
      paymasterVerificationGasLimit: BigNumber.from(150000).toString(),
      paymasterPostOpGasLimit: "0x1"
    } as PaymasterParams
  }

  toPackedUserOperationStruct(
    partial: Partial<PackedUserOperationStruct>
  ): PackedUserOperationStruct {
    return {
      sender: (partial.sender ?? "0x0000000000000000000000000000000000000000"),
      nonce: (partial.nonce ?? 0),
      initCode: (partial.initCode ?? "0x00"),
      callData: (partial.callData ?? "0x00"),
      accountGasLimits: (partial.accountGasLimits ?? "0x00"),
      preVerificationGas: (partial.preVerificationGas ?? 0),
      gasFees: (partial.gasFees ?? "0x00"),
      paymasterAndData: (partial.paymasterAndData ?? "0x00"),
      signature: (partial.signature ?? "0x00"),
    };
  }

   toUserOperation(partial: Partial<UserOperation>): UserOperation {
    return {
      sender: partial.sender || "0x0000000000000000000000000000000000000000",
      nonce: partial.nonce ?? 0,
      factory: partial.factory || undefined,
      factoryData: partial.factoryData || "0x",
      paymaster: partial.paymaster || undefined,
      paymasterData: partial.paymasterData || "0x",
      maxFeePerGas: partial.maxFeePerGas ?? 0,
      maxPriorityFeePerGas: partial.maxPriorityFeePerGas ?? 0,
      callGasLimit: partial.callGasLimit ?? 0,
      verificationGasLimit: partial.verificationGasLimit ?? 0,
      paymasterVerificationGasLimit: partial.paymasterVerificationGasLimit || undefined,
      paymasterPostOpGasLimit: partial.paymasterPostOpGasLimit || undefined,
      authorizationList: partial.authorizationList || [],
      callData: partial.callData || "0x",
      signature: partial.signature || "0x",
      preVerificationGas: partial.preVerificationGas ?? 0,
    };
  }
}
