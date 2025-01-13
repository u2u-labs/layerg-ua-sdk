import { BigNumberish, BytesLike } from "ethers"
import { EIP7702Authorization } from "./EIP7702Authorization"

export interface OperationBase {
    sender: string
    nonce: BigNumberish
  
    factory?: string
    factoryData?: BytesLike
  
    paymaster?: string
    paymasterData?: BytesLike
  
    maxFeePerGas: BigNumberish
    maxPriorityFeePerGas: BigNumberish
  
    callGasLimit: BigNumberish
    verificationGasLimit: BigNumberish
    paymasterVerificationGasLimit?: BigNumberish
    paymasterPostOpGasLimit?: BigNumberish
    authorizationList?: EIP7702Authorization[]
  }