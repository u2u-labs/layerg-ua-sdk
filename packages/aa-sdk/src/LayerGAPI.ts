import { ethers } from "ethers";

export interface LayerGAPIParams {
    apiKey: string
    secretKey?: string
    origin: string
}

export class LayerGAPI {
    private publickey: string
    private secretKey?: string
    private domain: string

    constructor(
        params: LayerGAPIParams
    ) {
        this.publickey = params.apiKey
        this.secretKey = params.secretKey
        // Extract domain from origin
        this.domain = new URL(params.origin).hostname;
    }

    async createSignature(
        timestamp: number
    ) {
        if (!this.secretKey) {
            throw new Error('Missing secret key')
        }
        // Create message to sign
        const message = `${this.domain}:${timestamp}:${this.publickey}`;
        // Create signature using ethers
        const signer = new ethers.Wallet(this.addPrefix(this.secretKey));
        const signature = await signer.signMessage(message.toLowerCase());
        return {
            signature,
            timestamp,
            domain: this.domain
        };
    }

    getSignatureSigner(
        timestamp: number,
        signature: string,
    ): string {
        // Recreate the original message
        const message = `${this.domain}:${timestamp}:${this.publickey}`;
        // Recover the address that signed the message
        return ethers.utils.verifyMessage(message.toLowerCase(), signature);
    }

    // Add 0x prefix if not present
    addPrefix = (address: string): string => {
        if (!address) return address;
        return address.startsWith('0x') ? address : `0x${address}`;
    }

}