import { providers } from "ethers";

export class AuthProvider extends providers.StaticJsonRpcProvider {
    private authToken: string;

    constructor(url: string, authToken: string) {
        super(url);
        this.authToken = authToken;
    }

    // Override the send method to include auth headers
    async send(method: string, params: Array<any>): Promise<any> {
        const request = {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            },
            body: JSON.stringify({
                method,
                params,
                id: Math.floor(Math.random() * 1000000),
                jsonrpc: "2.0"
            })
        };

        const response = await fetch(this.connection.url, request);
        const result = await response.json();

        if (result.error) {
            throw new Error(result.error.message || 'RPC Error');
        }

        return result.result;
    }
}