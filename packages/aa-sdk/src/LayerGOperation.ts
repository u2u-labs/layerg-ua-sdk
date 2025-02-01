import { Provider, TransactionRequest } from "@ethersproject/providers"
import { Deferrable } from "@ethersproject/properties"
import { Signer, providers, utils } from "ethers"
import { UserOperation } from "@layerg-ua-sdk/aa-utils";
import { BaseAccountAPI } from "./BaseAccountAPI";
export interface LayerGOperationParams {
    smartAccountAPI: BaseAccountAPI
    provider: providers.Provider;
}

export class LayerGOperation extends Signer {
    private smartAccountAPI: BaseAccountAPI
    provider: providers.Provider;

    constructor(
        params: LayerGOperationParams
    ) {
        super();
        this.provider = params.provider
        this.smartAccountAPI = params.smartAccountAPI
    }


    async buildUserOperation(transaction: Deferrable<TransactionRequest>): Promise<UserOperation> {
        const tx: TransactionRequest = await this.populateTransaction(transaction)
        await this.verifyAllNecessaryFields(tx)
        const userOp = await this.smartAccountAPI.createSignedUserOp({
            target: tx.to ?? '',
            data: tx.data?.toString() ?? '',
            value: tx.value,
            gasLimit: tx.gasLimit
        })
        return userOp
    }

    async verifyAllNecessaryFields(transactionRequest: TransactionRequest): Promise<void> {
        if (transactionRequest.to == null) {
            throw new Error('Missing call target')
        }
        if (transactionRequest.data == null && transactionRequest.value == null) {
            // TBD: banning no-op UserOps seems to make sense on provider level
            throw new Error('Missing call data or value')
        }
    }

    connect(provider: Provider): Signer {
        throw new Error('changing providers is not supported')
    }

    async getAddress(): Promise<string> {
        // Return the smart account address
        return await this.smartAccountAPI.getAccountAddress();
    }

    async signMessage(message: string | utils.Bytes): Promise<string> {
        // Implement your message signing logic
        throw new Error('Method not implemented.');
    }

    async signTransaction(transaction: TransactionRequest): Promise<string> {
        // Implement your transaction signing logic
        throw new Error('Method not implemented.');
    }
}