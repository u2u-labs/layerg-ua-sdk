import { Deferrable } from "@ethersproject/properties";
import { ContractCallParams } from "./types";
import { TransactionRequest } from "@ethersproject/providers";
import { Interface } from "ethers/lib/utils";
import { ethers } from "ethers";

export const buildContractCallRequest = ({
    sender,
    contractAddress,
    abi,
    method,
    params = [],
    value = '0'
}: ContractCallParams): Deferrable<TransactionRequest> => {
    try {
        // Create contract interface
        const iface = new Interface(abi);
        // Encode function data
        const data = iface.encodeFunctionData(method, params);
        // Build transaction
        return {
            from: sender,
            to: contractAddress,
            data: data,
            value: ethers.BigNumber.from(value)
        };
    } catch (error) {
        console.error('Failed to call smart contract:', error);
        throw error;
    }
}