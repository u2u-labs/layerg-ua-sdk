import { Provider } from "@ethersproject/providers"
import { PaymasterAPI } from "./PaymasterAPI"
import { BigNumber, BigNumberish, BytesLike, Signer, ethers } from "ethers"
import { defaultAbiCoder } from "ethers/lib/utils"
import { IEntryPoint, IEntryPoint__factory, UserOperation, encodeUserOp, getUserOpHash } from "@layerg-ua-sdk/aa-utils"
import { TransactionDetailsForUserOp } from "./TransactionDetailsForUserOp"


export interface FactoryParams {
    factory: string
    factoryData?: BytesLike
}

export interface BaseApiParams {
    provider: Provider
    entryPointAddress: string
    accountAddress?: string
    paymasterAPI?: PaymasterAPI
    owner: Signer
    accountIndex?: BigNumberish
}


export abstract class BaseAccountAPI {

    private senderAddress!: string
    private isPhantom = true
    
    // entryPoint connected to "zero" address. allowed to make static calls (e.g. to getSenderAddress)
    private readonly entryPointView: IEntryPoint

    provider: Provider
    entryPointAddress: string
    accountAddress?: string
    paymasterAPI?: PaymasterAPI
    owner: Signer

    /**
     * base constructor.
     * subclass SHOULD add parameters that define the owner (signer) of this wallet
     */
    protected constructor(params: BaseApiParams) {
        this.provider = params.provider
        this.entryPointAddress = params.entryPointAddress
        this.accountAddress = params.accountAddress
        this.paymasterAPI = params.paymasterAPI
        this.owner = params.owner

        // factory "connect" define the contract address. the contract "connect" defines the "from" address.
        this.entryPointView = IEntryPoint__factory.connect(params.entryPointAddress, params.provider).connect(ethers.constants.AddressZero)
    }

    async init(): Promise<this> {
        if (await this.provider.getCode(this.entryPointAddress) === '0x') {
            throw new Error(`entryPoint not deployed at ${this.entryPointAddress}`)
        }

        await this.getAccountAddress()
        return this
    }

    /**
   * return the value to put into the "factory" and "factoryData", when the contract is not yet deployed.
   */
    abstract getFactoryData(): Promise<FactoryParams | null>

    /**
     * return current account's nonce.
     */
    abstract getNonce(): Promise<BigNumber>

    /**
   * encode the call from entryPoint through our account to the target contract.
   * @param target
   * @param value
   * @param data
   */
    abstract encodeExecute(target: string, value: BigNumberish, data: string): Promise<string>

    /**
     * sign a userOp's hash (userOpHash).
     * @param userOpHash
     */
    abstract signUserOpHash(userOpHash: string): Promise<string>

    /**
     * check if the contract is already deployed.
     */
    async checkAccountPhantom(): Promise<boolean> {
        try {
            const accountAddress = await this.getAccountAddress();
            
            // Get code at the account address
            const senderAddressCode = await this.provider.getCode(accountAddress);
            
            // Log the result for debugging
            if (senderAddressCode !== '0x' && senderAddressCode !== '0x0') {
                this.isPhantom = false;
            } else {
                this.isPhantom = true;
            }

            return this.isPhantom;
        } catch (error) {
            console.error(`Error checking account phantom status: ${error}`);
            // Default to assuming it's a phantom if there's an error
            // This is safer as we'll attempt to deploy
            return true;
        }



    }

    /**
     * calculate the account address even before it is deployed
     */
    async getCounterFactualAddress(): Promise<string> {
        const { factory, factoryData } = await this.getFactoryData() ?? {}
        if (factory == null) {
            throw new Error(('no counter factual address if not factory'))
        }
        // use entryPoint to query account address (factory can provide a helper method to do the same, but
        // this method attempts to be generic
        const retAddr = await this.provider.call({
            to: factory, data: factoryData
        })
        const [addr] = defaultAbiCoder.decode(['address'], retAddr)
        return addr
    }

    /**
     * return initCode value to into the UserOp.
     * (either factory and factoryData, or null hex if contract already deployed)
     */
    async getRequiredFactoryData(): Promise<FactoryParams | null> {
        const isPhantom = await this.checkAccountPhantom();
        if (isPhantom) {
            // Double-check with a direct code query to be sure
            const address = await this.getAccountAddress();
            const code = await this.provider.getCode(address);
            
            if (code.length > 2) {
                this.isPhantom = false;
                return null;
            }
            return await this.getFactoryData();
        }
        
        return null;
    
    }

    /**
     * return maximum gas used for verification.
     * NOTE: createUnsignedUserOp will add to this value the cost of creation, if the contract is not yet created.
     */
    async getVerificationGasLimit(): Promise<BigNumberish> {
        return 100000
    }

    /**
  * ABI-encode a user operation. used for calldata cost estimation
  */
    encodeUserOP(userOp: UserOperation): string {
        return encodeUserOp(userOp, false)
    }

    async encodeUserOpCallDataAndGasLimit(detailsForUserOp: TransactionDetailsForUserOp): Promise<{ callData: string, callGasLimit: BigNumber }> {
        function parseNumber(a: any): BigNumber | null {
            if (a == null || a === '') return null
            return BigNumber.from(a.toString())
        }

        const value = parseNumber(detailsForUserOp.value) ?? BigNumber.from(0)
        const callData = await this.encodeExecute(detailsForUserOp.target, value, detailsForUserOp.data)

        const callGasLimit = parseNumber(detailsForUserOp.gasLimit) ?? await this.provider.estimateGas({
            from: this.entryPointAddress,
            to: this.getAccountAddress(),
            data: callData
        })

        return {
            callData,
            callGasLimit
        }
    }

    /**
     * return userOpHash for signing.
     * This value matches entryPoint.getUserOpHash (calculated off-chain, to avoid a view call)
     * @param op userOperation, (signature field ignored)
     */
    async getUserOpHash(op: UserOperation): Promise<string> {
        const chainId = await this.provider.getNetwork().then(net => net.chainId)
        return getUserOpHash(op, this.entryPointAddress, chainId)
    }

    /**
     * return the account's address.
     * this value is valid even before deploying the contract.
     */
    async getAccountAddress(): Promise<string> {
        if (this.senderAddress == null) {
            if (this.accountAddress != null) {
                this.senderAddress = this.accountAddress
            } else {
                this.senderAddress = await this.getCounterFactualAddress()
            }
        }
        return this.senderAddress
    }

    async estimateCreationGas(factoryParams: FactoryParams | null): Promise<BigNumberish> {
        if (factoryParams == null) {
            return 0
        }
        return await this.provider.estimateGas({ to: factoryParams.factory, data: factoryParams.factoryData })
    }

    /**
     * create a UserOperation, filling all details (except signature)
     * - if account is not yet created, add initCode to deploy it.
     * - if gas or nonce are missing, read them from the chain (note that we can't fill gaslimit before the account is created)
     * @param info
     */
    async createUnsignedUserOp(info: TransactionDetailsForUserOp): Promise<UserOperation> {
        const {
            callData,
            callGasLimit
        } = await this.encodeUserOpCallDataAndGasLimit(info)
        const factoryParams = await this.getRequiredFactoryData()

        const initGas = await this.estimateCreationGas(factoryParams)
        const verificationGasLimit = BigNumber.from(await this.getVerificationGasLimit())
            .add(initGas)

        let {
            maxFeePerGas,
            maxPriorityFeePerGas
        } = info
        if (maxFeePerGas == null || maxPriorityFeePerGas == null) {
            const feeData = await this.provider.getFeeData()
            if (maxFeePerGas == null) {
                maxFeePerGas = feeData.maxFeePerGas ?? undefined
            }
            if (maxPriorityFeePerGas == null) {
                maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? undefined
            }
        }

        let partialUserOp = {
            sender: await this.getAccountAddress(),
            nonce: info.nonce ?? await this.getNonce(),
            factory: factoryParams?.factory,
            factoryData: factoryParams?.factoryData,
            callData,
            callGasLimit,
            verificationGasLimit,
            maxFeePerGas: maxFeePerGas as any,
            maxPriorityFeePerGas: maxPriorityFeePerGas as any,
            authorizationList: []
        }

        if (this.paymasterAPI != null) {
            // fill (partial) preVerificationGas (all except the cost of the generated paymasterAndData)

            const pmFields = await this.paymasterAPI.getTemporaryPaymasterData(partialUserOp, "0", "0", this.owner)
            if (pmFields != null) {
                partialUserOp = {
                    ...partialUserOp,
                    paymaster: pmFields?.paymaster,
                    paymasterPostOpGasLimit: pmFields?.paymasterPostOpGasLimit,
                    paymasterVerificationGasLimit: pmFields?.paymasterVerificationGasLimit,
                    paymasterData: pmFields?.paymasterData
                } as any
            }
        }
        return {
            ...partialUserOp,
            preVerificationGas: 60000,
            signature: '0x00'
        }
    }

    /**
     * Sign the filled userOp.
     * @param userOp the UserOperation to sign (with signature field ignored)
     */
    async signUserOp(userOp: UserOperation): Promise<UserOperation> {
        const userOpHash = await this.getUserOpHash(userOp)
        const signature = await this.signUserOpHash(userOpHash)
        return {
            ...userOp,
            signature
        }
    }

    /**
     * helper method: create and sign a user operation.
     * @param info transaction details for the userOp
     */
    async createSignedUserOp(info: TransactionDetailsForUserOp): Promise<UserOperation> {
        return await this.signUserOp(await this.createUnsignedUserOp(info))
    }

    /**
     * get the transaction that has this userOpHash mined, or null if not found
     * @param userOpHash returned by sendUserOpToBundler (or by getUserOpHash..)
     * @param timeout stop waiting after this timeout
     * @param interval time to wait between polls.
     * @return the transactionHash this userOp was mined, or null if not found.
     */
    async getUserOpReceipt(userOpHash: string, timeout = 30000, interval = 5000): Promise<string | null> {
        const endtime = Date.now() + timeout
        while (Date.now() < endtime) {
            const events = await this.entryPointView.queryFilter(this.entryPointView.filters.UserOperationEvent(userOpHash))
            if (events.length > 0) {
                return events[0].transactionHash
            }
            await new Promise(resolve => setTimeout(resolve, interval))
        }
        return null
    }

}