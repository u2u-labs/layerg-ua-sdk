// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 *  @title   PermissionsEnumerable
 *  @dev     This contracts provides extending-contracts with role-based access control mechanisms.
 *           Also provides interfaces to view all members with a given role, and total count of members.
 */

library PermissionsEnumerableStorage {
    /// @custom:storage-location erc7201:extension.manager.storage
    bytes32 public constant PERMISSIONS_ENUMERABLE_STORAGE_POSITION =
        keccak256(abi.encode(uint256(keccak256("permissions.enumerable.storage")) - 1)) & ~bytes32(uint256(0xff));

    /**
     *  @notice A data structure to store data of members for a given role.
     *
     *  @param index    Current index in the list of accounts that have a role.
     *  @param members  map from index => address of account that has a role
     *  @param indexOf  map from address => index which the account has.
     */
    struct RoleMembers {
        uint256 index;
        mapping(uint256 => address) members;
        mapping(address => uint256) indexOf;
    }

    struct Data {
        /// @dev map from keccak256 hash of a role to its members' data. See {RoleMembers}.
        mapping(bytes32 => RoleMembers) roleMembers;
    }

    function data() internal pure returns (Data storage data_) {
        bytes32 position = PERMISSIONS_ENUMERABLE_STORAGE_POSITION;
        assembly {
            data_.slot := position
        }
    }
}