import { GAccount, GAccountFactory, GAccountFactory__factory, GAccount__factory } from "@layerg-ua-sdk/aa-utils";
import { BaseAccountAPI, BaseApiParams, FactoryParams } from "./BaseAccountAPI";
import { BigNumber, BigNumberish, Signer, ethers } from "ethers";
import { arrayify } from "ethers/lib/utils";


export interface GAccountApiParams extends BaseApiParams {
    factoryAddress?: string
    projectApiKey?: string
    walletId?: string
}

export class GAccountAPI extends BaseAccountAPI {
    factoryAddress?: string
    projectApiKey?: string
    walletId?: string
    accountContract?: GAccount
    factory?: GAccountFactory

    constructor(params: GAccountApiParams) {
        super(params)
        this.factoryAddress = params.factoryAddress
        this.projectApiKey = params.projectApiKey ? params.projectApiKey.startsWith('0x') ? params.projectApiKey : `0x${params.projectApiKey}` : '';
        this.walletId = params.walletId;
    }

    /**
     * return the value to put into the "initCode" field, if the account is not yet deployed.
     * this value holds the "factory" address, followed by this account's information
    */
    async getFactoryData(): Promise<FactoryParams | null> {
        if (this.factory == null) {
            if (this.factoryAddress != null && this.factoryAddress !== '') {
                this.factory = GAccountFactory__factory.connect(this.factoryAddress, this.provider)
            } else {
                throw new Error('no factory to get initCode')
            }
        }
        const indexBytes = ethers.utils.defaultAbiCoder.encode(['address', 'address', 'string'], [this.factoryAddress, this.projectApiKey, this.walletId]); // Convert index to bytes  
        return {
            factory: this.factory.address,
            factoryData: this.factory.interface.encodeFunctionData('createAccount', [await this.owner.getAddress(), indexBytes])
        }
    }

    async getNonce(): Promise<BigNumber> {
        if (await this.checkAccountPhantom()) {
            return BigNumber.from(0)
        }
        const accountContract = await this._getAccountContract()
        return await accountContract.getNonce()
    }

    async _getAccountContract(): Promise<GAccount> {
        if (this.accountContract == null) {
            this.accountContract = GAccount__factory.connect(await this.getAccountAddress(), this.provider)
        }
        return this.accountContract
    }

    /**
     * encode a method call from entryPoint to our contract
     * @param target
     * @param value
     * @param data
     */
    async encodeExecute(target: string, value: BigNumberish, data: string): Promise<string> {
        const accountContract = await this._getAccountContract()
        return accountContract.interface.encodeFunctionData(
            'execute',
            [
                target,
                value,
                data
            ])
    }

    async signUserOpHash(userOpHash: string): Promise<string> {
        return await this.owner.signMessage(arrayify(userOpHash))
    }
}