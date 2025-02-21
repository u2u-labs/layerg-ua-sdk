import { Provider, TransactionRequest } from "@ethersproject/providers"
import { Deferrable, resolveProperties } from "@ethersproject/properties"
import { BigNumber, Signer, providers, utils } from "ethers"
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

    async customPopulateTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionRequest> {
        const tx: TransactionRequest = {
            // Resolve any promises in the transaction
            ...(await resolveProperties(transaction)),
            // Don't include 'from' as it will be the smart account address
        };
    
        if (tx.gasLimit == null) {
            tx.gasLimit = BigNumber.from(1000000); // Default gas limit or get from estimation
        }
    
        // Set default values if not provided
        if (tx.value == null) {
            tx.value = BigNumber.from(0);
        }
        if (tx.data == null) {
            tx.data = '0x';
        }
    
        // EIP-1559 parameters
        if (tx.maxFeePerGas == null || tx.maxPriorityFeePerGas == null) {
            const feeData = await this.provider.getFeeData();
            if (tx.maxFeePerGas == null) {
                tx.maxFeePerGas = feeData.maxFeePerGas ?? undefined;
            }
            if (tx.maxPriorityFeePerGas == null) {
                tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? undefined;
            }
        }
    
        // Set type to EIP-1559
        tx.type = 2;
    
        return tx;
    }


    async buildUserOperation(transaction: Deferrable<TransactionRequest>): Promise<UserOperation> {
        const tx: TransactionRequest = await this.customPopulateTransaction(transaction)
        await this.verifyAllNecessaryFields(tx)
        const userOp = await this.smartAccountAPI.createSignedUserOp({
            target: tx.to ?? '',
            data: tx.data?.toString() ?? '',
            value: tx.value ?? '0x0'
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