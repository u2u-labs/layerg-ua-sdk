import { BytesLike, defaultAbiCoder, hexConcat, hexZeroPad, hexlify, isHexString, keccak256 } from "ethers/lib/utils"
import { UserOperation } from "./interfaces/UserOperation"
import { PackedUserOperation } from "./Utils"
import { BigNumber, BigNumberish, ethers, logger } from "ethers"

export const AddressZero = ethers.constants.AddressZero

export const maxUint48 = (2 ** 48) - 1
export const SIG_VALIDATION_FAILED = hexZeroPad('0x01', 20)

export interface ValidationData {
  aggregator: string
  validAfter: number
  validUntil: number
}

/**
 * hexlify all members of object, recursively
 * @param obj
 */
export function deepHexlify (obj: any): any {
  if (typeof obj === 'function') {
    return undefined
  }
  if (obj == null || typeof obj === 'string' || typeof obj === 'boolean') {
    return obj
  } else if (obj._isBigNumber != null || typeof obj !== 'object') {
    return hexlify(obj).replace(/^0x0/, '0x')
  }
  if (Array.isArray(obj)) {
    return obj.map(member => deepHexlify(member))
  }
  return Object.keys(obj)
    .reduce((set, key) => ({
      ...set,
      [key]: deepHexlify(obj[key])
    }), {})
}

/**
 * abi-encode the userOperation
 * @param op a PackedUserOp
 * @param forSignature "true" if the hash is needed to calculate the getUserOpHash()
 *  "false" to pack entire UserOp, for calculating the calldata cost of putting it on-chain.
 */
export function encodeUserOp (op1: PackedUserOperation | UserOperation, forSignature = true): string {
  // if "op" is unpacked UserOperation, then pack it first, before we ABI-encode it.
  let op: PackedUserOperation
  if ('callGasLimit' in op1) {
    op = packUserOp(op1)
  } else {
    op = op1
  }
  if (forSignature) {
    return defaultAbiCoder.encode(
      ['address', 'uint256', 'bytes32', 'bytes32',
        'bytes32', 'uint256', 'bytes32',
        'bytes32'],
      [op.sender, op.nonce, keccak256(op.initCode), keccak256(op.callData),
        op.accountGasLimits, op.preVerificationGas, op.gasFees,
        keccak256(op.paymasterAndData)])
  } else {
    // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
    return defaultAbiCoder.encode(
      ['address', 'uint256', 'bytes', 'bytes',
        'bytes32', 'uint256', 'bytes32',
        'bytes', 'bytes'],
      [op.sender, op.nonce, op.initCode, op.callData,
        op.accountGasLimits, op.preVerificationGas, op.gasFees,
        op.paymasterAndData, op.signature])
  }
}

export function packUserOp (op: UserOperation): PackedUserOperation {
  let paymasterAndData: BytesLike
  if (op.paymaster == null) {
    paymasterAndData = '0x'
  } else {
    if (op.paymasterVerificationGasLimit == null || op.paymasterPostOpGasLimit == null) {
      throw new Error('paymaster with no gas limits')
    }
    paymasterAndData = packPaymasterData(op.paymaster, op.paymasterVerificationGasLimit, op.paymasterPostOpGasLimit, op.paymasterData)
  }
  return {
    sender: op.sender,
    nonce: BigNumber.from(op.nonce).toHexString(),
    initCode: op.factory == null ? '0x' : hexConcat([op.factory, op.factoryData ?? '']),
    callData: op.callData,
    accountGasLimits: packUint(op.verificationGasLimit, op.callGasLimit),
    preVerificationGas: BigNumber.from(op.preVerificationGas).toHexString(),
    gasFees: packUint(op.maxPriorityFeePerGas, op.maxFeePerGas),
    paymasterAndData,
    signature: op.signature
  }
}

export function packPaymasterData (paymaster: string, paymasterVerificationGasLimit: BigNumberish, postOpGasLimit: BigNumberish, paymasterData?: BytesLike): BytesLike {
  return ethers.utils.hexConcat([
    paymaster,
    packUint(paymasterVerificationGasLimit, postOpGasLimit),
    paymasterData ?? '0x'
  ])
}

export function packUint (high128: BigNumberish, low128: BigNumberish): string {
  return hexZeroPad(BigNumber.from(high128).shl(128).add(low128).toHexString(), 32)
}

/**
 * calculate the userOpHash of a given userOperation.
 * The userOpHash is a hash of all UserOperation fields, except the "signature" field.
 * The entryPoint uses this value in the emitted UserOperationEvent.
 * A wallet may use this value as the hash to sign (the SampleWallet uses this method)
 * @param op
 * @param entryPoint
 * @param chainId
 */
export function getUserOpHash (op: UserOperation, entryPoint: string, chainId: number): string {
  const userOpHash = keccak256(encodeUserOp(op, true))
  const enc = defaultAbiCoder.encode(
    ['bytes32', 'address', 'uint256'],
    [userOpHash, entryPoint, chainId])
  return keccak256(enc)
}


export function mergeValidationDataValues (accountValidationData: BigNumberish, paymasterValidationData: BigNumberish): ValidationData {
  return mergeValidationData(
    parseValidationData(accountValidationData),
    parseValidationData(paymasterValidationData)
  )
}


/**
 * merge validationData structure returned by paymaster and account
 * @param accountValidationData returned from validateUserOp
 * @param paymasterValidationData returned from validatePaymasterUserOp
 */
export function mergeValidationData (accountValidationData: ValidationData, paymasterValidationData: ValidationData): ValidationData {
  return {
    aggregator: paymasterValidationData.aggregator !== AddressZero ? SIG_VALIDATION_FAILED : accountValidationData.aggregator,
    validAfter: Math.max(accountValidationData.validAfter, paymasterValidationData.validAfter),
    validUntil: Math.min(accountValidationData.validUntil, paymasterValidationData.validUntil)
  }
}


/**
 * parse validationData as returned from validateUserOp or validatePaymasterUserOp into ValidationData struct
 * @param validationData
 */
export function parseValidationData (validationData: BigNumberish): ValidationData {
  const data = hexZeroPad(BigNumber.from(validationData).toHexString(), 32)

  // string offsets start from left (msb)
  const aggregator = hexDataSlice(data, 32 - 20)
  let validUntil = parseInt(hexDataSlice(data, 32 - 26, 32 - 20))
  if (validUntil === 0) validUntil = maxUint48
  const validAfter = parseInt(hexDataSlice(data, 0, 6))

  return {
    aggregator,
    validAfter,
    validUntil
  }
}

export function hexDataSlice(data: BytesLike, offset: number, endOffset?: number): string {
  if (typeof(data) !== "string") {
      data = hexlify(data);
  } else if (!isHexString(data) || (data.length % 2)) {
      logger.throwArgumentError("invalid hexData", "value", data );
  }

  offset = 2 + 2 * offset;

  if (endOffset != null) {
      return "0x" + data.substring(offset, 2 + 2 * endOffset);
  }

  return "0x" + data.substring(offset);
}