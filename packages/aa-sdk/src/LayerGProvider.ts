import { Provider, TransactionRequest } from "@ethersproject/providers"
import { Deferrable } from "@ethersproject/properties"
import { Signer, Wallet, ethers, providers, utils } from "ethers"
import axios, { AxiosInstance } from 'axios';
import { UserOperation, deepHexlify } from "@layerg-ua-sdk/aa-utils";
import { BaseAccountAPI } from "./BaseAccountAPI";
import { UserOperationResponse } from "./types";


export class LayerGProvider extends Signer {

    private client: AxiosInstance;
    private entryPoint: string;
    provider: providers.Provider;

    constructor(
        readonly smartAccountAPI: BaseAccountAPI,
        bundlerUrl: string,
        entryPoint: string,
        authToken?: string,
        rpcUrl?: string,
    ) {
        super();
        this.provider = new providers.JsonRpcProvider(rpcUrl);
        this.entryPoint = entryPoint;
        this.client = axios.create({
            baseURL: bundlerUrl,
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { Authorization: `Bearer ${authToken}` })
            }
        });
    }

    async builAndSendUserOperation (transaction: Deferrable<TransactionRequest>): Promise<string> {
        const userOp = await this.buildUserOperation(transaction)
        return this.sendUserOperation(userOp);
    }

    async sendUserOperation(userOp: UserOperation): Promise<string> {
        try {
            const hexifiedUserOp = deepHexlify(userOp)
            const response = await this.client.post('', {
                jsonrpc: '2.0',
                method: 'eth_sendUserOperation',
                params: [hexifiedUserOp, this.entryPoint],
                id: Date.now()
            });
            return response.data;
        } catch (error) {
            console.error('Failed to send user operation:', error);
            throw error;
        }
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

    async getUserOperationByHash(hash: string): Promise<UserOperationResponse | null> {
        try {
            const response = await this.client.post('', {
                jsonrpc: '2.0',
                method: 'eth_getUserOperationByHash',
                params: [hash],
                id: Date.now()
            });

            // If no result found
            if (!response.data) {
                return null;
            }

            return response.data;
        } catch (error) {
            console.error('Failed to get user operation:', error);
            throw error;
        }
    }

    async getUserOperationReceipt(hash: string): Promise<any | null> {
        try {
            const response = await this.client.post('', {
                jsonrpc: '2.0',
                method: 'eth_getUserOperationReceipt',
                params: [hash],
                id: Date.now()
            });

            // If no receipt found
            if (!response.data) {
                return null;
            }

            return response.data;
        } catch (error) {
            console.error('Failed to get user operation receipt:', error);
            throw error;
        }
    }

    // Helper method to wait for receipt
    async waitForUserOperationReceipt(hash: string, timeout = 60000, interval = 5000): Promise<any> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const receipt = await this.getUserOperationReceipt(hash);
            if (receipt) {
                return receipt;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        throw new Error('Timeout waiting for UserOperation receipt');
    }

    // Helper method to wait for UserOperation to be included
    async waitForUserOperation(hash: string, timeout = 60000, interval = 5000): Promise<UserOperationResponse> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const receipt = await this.getUserOperationByHash(hash);
            if (receipt) {
                return receipt;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        throw new Error('Timeout waiting for UserOperation');
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