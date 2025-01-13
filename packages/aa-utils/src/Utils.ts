
import {
    PackedUserOperationStruct
} from "@layerg-ua-sdk/aa-smc/typechain-types/contracts/core/EntryPoint"
import { BigNumber, BigNumberish, ethers } from "ethers"
import { UserOperation } from "./interfaces/UserOperation"
import { OperationBase } from "./interfaces/OperationBase"
import { OperationRIP7560 } from "./interfaces/OperationRIP7560"

export interface StakeInfo {
    addr: string
    stake: BigNumberish
    unstakeDelaySec: BigNumberish
}

export enum ValidationErrors {
    // standard EIP-1474 errors:
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidFields = -32602,
    InternalError = -32603,

    // ERC-4337 errors:
    SimulateValidation = -32500,
    SimulatePaymasterValidation = -32501,
    OpcodeValidation = -32502,
    NotInTimeRange = -32503,
    Reputation = -32504,
    InsufficientStake = -32505,
    UnsupportedSignatureAggregator = -32506,
    InvalidSignature = -32507,
    PaymasterDepositTooLow = -32508,
    UserOperationReverted = -32521
}


// reverse "Deferrable" or "PromiseOrValue" fields
export type NotPromise<T> = {
    [P in keyof T]: Exclude<T[P], Promise<any>>
}

export type PackedUserOperation = NotPromise<PackedUserOperationStruct>

export class RpcError extends Error {
    constructor(msg: string, readonly code: number, readonly data: any = undefined) {
        super(msg)
    }
}

export interface SlotMap {
    [slot: string]: string
}

/**
 * map of storage
 * for each address, either a root hash, or a map of slot:value
 */
export interface StorageMap {
    [address: string]: string | SlotMap
}


/**
 * sum the given bignumberish items (numbers, hex, bignumbers)
 */
export function sum(...args: BigNumberish[]): BigNumber {
    return args.reduce((acc: BigNumber, cur) => acc.add(cur), BigNumber.from(0))
}

/**
 * calculate the maximum cost of a UserOperation.
 * the cost is the sum of the verification gas limits and call gas limit, multiplied by the maxFeePerGas.
 * @param userOp
 */
export function getUserOpMaxCost(userOp: OperationBase): BigNumber {
    const preVerificationGas: BigNumberish = (userOp as UserOperation).preVerificationGas
    return sum(
        preVerificationGas ?? 0,
        userOp.verificationGasLimit,
        userOp.callGasLimit,
        userOp.paymasterVerificationGasLimit ?? 0,
        userOp.paymasterPostOpGasLimit ?? 0
    ).mul(userOp.maxFeePerGas)
}

export function requireCond(cond: boolean, msg: string, code: number, data: any = undefined): void {
    if (!cond) {
        throw new RpcError(msg, code, data)
    }
}

export interface ReferencedCodeHashes {
    // addresses accessed during this user operation
    addresses: string[]

    // keccak over the code of all referenced addresses
    hash: string
}

export function getPackedNonce(userOp: OperationBase): BigNumber {
    const nonceKey = (userOp as OperationRIP7560).nonceKey
    if (nonceKey == null || BigNumber.from(nonceKey).eq(0)) {
        // Either not RIP-7560 operation or not using RIP-7712 nonce
        return BigNumber.from(userOp.nonce)
    }
    const packed = ethers.utils.solidityPack(['uint192', 'uint64'], [nonceKey, userOp.nonce])
    const bigNumberNonce = BigNumber.from(packed)
    return bigNumberNonce
}

export function tostr (s: BigNumberish): string {
    return BigNumber.from(s).toString()
}

// verify that either address field exist along with "mustFields",
// or address field is missing, and none of the must (or optional) field also exists
export function requireAddressAndFields (userOp: OperationBase, addrField: string, mustFields: string[], optionalFields: string[] = []): void {
    const op = userOp as any
    const addr = op[addrField]
    if (addr == null) {
      const unexpected = Object.entries(op)
        .filter(([name, value]) => value != null && (mustFields.includes(name) || optionalFields.includes(name)))
      requireCond(unexpected.length === 0,
        `no ${addrField} but got ${unexpected.join(',')}`, ValidationErrors.InvalidFields)
    } else {
      requireCond(addr.match(/^0x[a-f0-9]{10,40}$/i), `invalid ${addrField}`, ValidationErrors.InvalidFields)
      const missing = mustFields.filter(name => op[name] == null)
      requireCond(missing.length === 0,
        `got ${addrField} but missing ${missing.join(',')}`, ValidationErrors.InvalidFields)
    }
  }