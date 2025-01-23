export interface UserOperationResponse {
    userOperation: any;
    entryPoint: string;
    transactionHash: any;
    blockHash?: string;
    blockNumber?: number;
}