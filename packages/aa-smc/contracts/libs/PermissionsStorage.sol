// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 *  @title   Permissions
 *  @dev     This contracts provides extending-contracts with role-based access control mechanisms
 */

library PermissionsStorage {
    /// @custom:storage-location erc7201:permissions.storage
    /// @dev keccak256(abi.encode(uint256(keccak256("permissions.storage")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 public constant PERMISSIONS_STORAGE_POSITION =
        0x0a7b0f5c59907924802379ebe98cdc23e2ee7820f63d30126e10b3752010e500;

    struct Data {
        /// @dev Map from keccak256 hash of a role => a map from address => whether address has role.
        mapping(bytes32 => mapping(address => bool)) _hasRole;
        /// @dev Map from keccak256 hash of a role to role admin. See {getRoleAdmin}.
        mapping(bytes32 => bytes32) _getRoleAdmin;
    }

    function data() internal pure returns (Data storage data_) {
        bytes32 position = PERMISSIONS_STORAGE_POSITION;
        assembly {
            data_.slot := position
        }
    }
}
