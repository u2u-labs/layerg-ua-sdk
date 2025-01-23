export interface UserOperationResponse {
    userOperation: any;
    entryPoint: string;
    transactionHash: any;
    blockHash?: string;
    blockNumber?: number;
}

export interface ContractCallParams {
    sender: string;
    contractAddress: string;
    abi: any[];
    method: string;
    params?: any[];
    value?: string;
}