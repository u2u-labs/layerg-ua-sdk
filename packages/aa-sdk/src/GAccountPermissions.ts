import { ethers } from "ethers";

/**
 * Interface for the SignerPermissionRequest struct
 * Matches the Solidity struct exactly as defined in the contract
 */
export interface SignerPermissionRequest {
    signer: string;
    isAdmin: number;
    approvedTargets: string[];
    permissionStartTimestamp: ethers.BigNumberish;
    permissionEndTimestamp: ethers.BigNumberish;
    reqValidityStartTimestamp: ethers.BigNumberish;
    reqValidityEndTimestamp: ethers.BigNumberish;
    uid: string;
}

/**
 * Interface for the SignerPermissions struct
 * Matches the Solidity struct
 */
export interface SignerPermissions {
    signer: string;
    approvedTargets: string[];
    startTimestamp: ethers.BigNumberish;
    endTimestamp: ethers.BigNumberish;
}

/**
* Interface for the Account Permissions contract
* Matches the Solidity interface
*/
export interface IAccountPermissions extends ethers.Contract {
    // Write functions
    setPermissionsForSigner(
        req: SignerPermissionRequest,
        signature: string,
        overrides?: ethers.Overrides
    ): Promise<ethers.ContractTransaction>;

    // Read functions
    isAdmin(
        account: string,
        overrides?: ethers.CallOverrides
    ): Promise<boolean>;

    isActiveSigner(
        signer: string,
        overrides?: ethers.CallOverrides
    ): Promise<boolean>;

    getPermissionsForSigner(
        signer: string,
        overrides?: ethers.CallOverrides
    ): Promise<SignerPermissions>;

    getAllSigners(
        overrides?: ethers.CallOverrides
    ): Promise<SignerPermissions[]>;

    getAllActiveSigners(
        overrides?: ethers.CallOverrides
    ): Promise<SignerPermissions[]>;

    getAllAdmins(
        overrides?: ethers.CallOverrides
    ): Promise<string[]>;

    verifySignerPermissionRequest(
        req: SignerPermissionRequest,
        signature: string,
        overrides?: ethers.CallOverrides
    ): Promise<[boolean, string]>; // Returns [success, signer]
}

/**
 * Class for managing account permissions
 */
export class AccountPermissionsSDK {
    private contract: IAccountPermissions;
    private signer: ethers.Signer;

    /**
     * Creates a new instance of the AccountPermissionsSDK
     * 
     * @param contractAddress The address of the AccountPermissions contract
     * @param signer The ethers signer to use for transactions
     * @param provider Optional ethers provider
     */
    constructor(
        contractAddress: string,
        signer: ethers.Signer,
        provider?: ethers.providers.Provider
    ) {
        // Full ABI representing all functions in the GAccountPermissions contract
        const abi = [
            // External functions
            "function setPermissionsForSigner(tuple(address signer, uint8 isAdmin, address[] approvedTargets, uint128 permissionStartTimestamp, uint128 permissionEndTimestamp, uint128 reqValidityStartTimestamp, uint128 reqValidityEndTimestamp, bytes32 uid) _req, bytes _signature) external",

            // View functions
            "function isAdmin(address _account) external view returns (bool)",
            "function isActiveSigner(address signer) external view returns (bool)",
            "function getPermissionsForSigner(address signer) external view returns (tuple(address signer, address[] approvedTargets, uint128 startTimestamp, uint128 endTimestamp))",
            "function getAllSigners() external view returns (tuple(address signer, address[] approvedTargets, uint128 startTimestamp, uint128 endTimestamp)[])",
            "function getAllActiveSigners() external view returns (tuple(address signer, address[] approvedTargets, uint128 startTimestamp, uint128 endTimestamp)[])",
            "function getAllAdmins() external view returns (address[])",
            "function verifySignerPermissionRequest(tuple(address signer, uint8 isAdmin, address[] approvedTargets, uint128 permissionStartTimestamp, uint128 permissionEndTimestamp, uint128 reqValidityStartTimestamp, uint128 reqValidityEndTimestamp, bytes32 uid) req, bytes signature) external view returns (bool success, address signer)"
        ];

        this.signer = signer;
        this.contract = new ethers.Contract(
            contractAddress,
            abi,
            provider || signer
        ) as IAccountPermissions;
    }

    /**
    * Generate a unique ID for the permission request
    * 
    * @param req The signer permission request
    * @returns A bytes32 hash of the request parameters
    */
    public generatePermissionRequestUid(req: Omit<SignerPermissionRequest, 'uid'>): string {
        // Create a hash of the request parameters to use as the UID
        const encodedData = ethers.utils.defaultAbiCoder.encode(
            [
                'address',
                'uint8',
                'address[]',
                'uint128',
                'uint128',
                'uint128',
                'uint128'
            ],
            [
                req.signer,
                req.isAdmin,
                req.approvedTargets,
                req.permissionStartTimestamp,
                req.permissionEndTimestamp,
                req.reqValidityStartTimestamp,
                req.reqValidityEndTimestamp
            ]
        );

        return ethers.utils.keccak256(encodedData);
    }

    /**
     * Signs a permission request
     * 
     * @param req The signer permission request
     * @param signer The signer to sign the request (typically an admin)
     * @returns The signature
     */
    public async signPermissionRequest(
        req: SignerPermissionRequest,
        signer: ethers.Signer
    ): Promise<string> {
        // Define the domain and types for EIP-712 structured data exactly matching the contract
        const domain = {
            name: "Account",  // This must match exactly
            version: "1",     // This must match exactly
            chainId: await signer.getChainId(),
            verifyingContract: this.contract.address
        };

        // This must match EXACTLY the TYPEHASH in the contract:
        // SignerPermissionRequest(address signer,uint8 isAdmin,address[] approvedTargets,uint128 permissionStartTimestamp,uint128 permissionEndTimestamp,uint128 reqValidityStartTimestamp,uint128 reqValidityEndTimestamp,bytes32 uid)
        const types = {
            SignerPermissionRequest: [
                { name: 'signer', type: 'address' },
                { name: 'isAdmin', type: 'uint8' },
                { name: 'approvedTargets', type: 'address[]' },
                { name: 'permissionStartTimestamp', type: 'uint128' },
                { name: 'permissionEndTimestamp', type: 'uint128' },
                { name: 'reqValidityStartTimestamp', type: 'uint128' },
                { name: 'reqValidityEndTimestamp', type: 'uint128' },
                { name: 'uid', type: 'bytes32' }
            ]
        };

        // Use the proper method to sign typed data in ethers v5.7.0
        // First, create a typed data signer from the signer
        // We need to use the any type here because TypeScript definitions 
        // may not include the signTypedData method directly
        const typedDataSigner = signer as any;

        if (typeof typedDataSigner._signTypedData === 'function') {
            // Internal method available in ethers v5 (most common)
            return await typedDataSigner._signTypedData(domain, types, req);
        } else if (typeof typedDataSigner.signTypedData === 'function') {
            // Method available directly in some wallets
            return await typedDataSigner.signTypedData(domain, types, req);
        } else {
            // Fallback to using the ethers TypedDataEncoder directly
            const typedDataEncoder = ethers.utils._TypedDataEncoder;
            const hash = typedDataEncoder.hash(domain, types, req);

            // Sign the hash using standard message signing
            const messageBytes = ethers.utils.arrayify(hash);
            return await signer.signMessage(messageBytes);
        }
    }

    /**
     * Creates and sets permissions for a signer
     * 
     * @param options Configuration options for setting permissions
     * @returns Transaction receipt
     */
    public async setPermissionsForSigner(options: {
        targetSigner: string;
        isAdmin?: number; // 0: regular signer, 1: set as admin, >1: remove admin
        approvedTargets?: string[];
        permissionStartTimestamp?: number;
        permissionEndTimestamp?: number;
        reqValidityDuration?: number; // Duration in seconds for request validity
        adminSigner?: ethers.Signer; // The admin signer, defaults to the SDK's signer
    }): Promise<ethers.ContractTransaction> {
        const now = Math.floor(Date.now() / 1000);

        // Set default values
        const req: Omit<SignerPermissionRequest, 'uid'> = {
            signer: options.targetSigner,
            isAdmin: options.isAdmin || 0,
            approvedTargets: options.approvedTargets || [],
            permissionStartTimestamp: options.permissionStartTimestamp || now,
            permissionEndTimestamp: options.permissionEndTimestamp || 0, // 0 means no expiration in many contracts
            reqValidityStartTimestamp: 0,
            reqValidityEndTimestamp: now + (options.reqValidityDuration || 3600) // Default 1 hour validity
        };

        // Generate a UID for the request
        const uid = this.generatePermissionRequestUid(req);
        const fullReq: SignerPermissionRequest = {
            ...req,
            uid
        };

        // Sign the request
        const signerToUse = options.adminSigner || this.signer;
        const signature = await this.signPermissionRequest(fullReq, signerToUse);

        // Execute the transaction
        const tx = await this.contract.setPermissionsForSigner(fullReq, signature);
        return tx
    }

    /**
     * Helper method to add a regular signer with specific permissions
     */
    public async addSigner(options: {
        signerAddress: string;
        approvedTargets: string[];
        permissionStartTimestamp?: number;
        permissionEndTimestamp?: number;
        adminSigner?: ethers.Signer;
    }): Promise<ethers.ContractTransaction> {
        return this.setPermissionsForSigner({
            targetSigner: options.signerAddress,
            isAdmin: 0, // Regular signer
            approvedTargets: options.approvedTargets,
            permissionStartTimestamp: options.permissionStartTimestamp,
            permissionEndTimestamp: options.permissionEndTimestamp,
            adminSigner: options.adminSigner
        });
    }

    /**
     * Verifies a signer permission request signature without submitting a transaction
     * 
     * @param req The signer permission request
     * @param signature The signature to verify
     * @returns Promise resolving to [success, signerAddress]
     */
    public async verifyPermissionRequestSignature(
        req: SignerPermissionRequest,
        signature: string
    ): Promise<[boolean, string]> {
        return await this.contract.verifySignerPermissionRequest(req, signature);
    }

    /**
     * Checks if a given address is an admin
     * 
     * @param address The address to check
     * @returns Promise resolving to boolean
     */
    public async isAdmin(address: string): Promise<boolean> {
        return await this.contract.isAdmin(address);
    }

    /**
     * Checks if a given address is an active signer
     * 
     * @param address The address to check
     * @returns Promise resolving to boolean
     */
    public async isActiveSigner(address: string): Promise<boolean> {
        return await this.contract.isActiveSigner(address);
    }

    /**
     * Gets permissions for a specific signer
     * 
     * @param address The signer address
     * @returns Promise resolving to SignerPermissions
     */
    public async getPermissionsForSigner(address: string): Promise<SignerPermissions> {
        return await this.contract.getPermissionsForSigner(address);
    }

    /**
     * Gets all signers (active and inactive)
     * 
     * @returns Promise resolving to array of SignerPermissions
     */
    public async getAllSigners(): Promise<SignerPermissions[]> {
        return await this.contract.getAllSigners();
    }

    /**
     * Gets only active signers
     * 
     * @returns Promise resolving to array of SignerPermissions
     */
    public async getAllActiveSigners(): Promise<SignerPermissions[]> {
        return await this.contract.getAllActiveSigners();
    }

    /**
     * Gets all admin addresses
     * 
     * @returns Promise resolving to array of addresses
     */
    public async getAllAdmins(): Promise<string[]> {
        return await this.contract.getAllAdmins();
    }

}