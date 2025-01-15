// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../g-account/interfaces/IAccountPermissions.sol";


library AccountPermissionsStorage {
    /// @custom:storage-location erc7201:account.permissions.storage
    /// @dev keccak256(abi.encode(uint256(keccak256("account.permissions.storage")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 public constant ACCOUNT_PERMISSIONS_STORAGE_POSITION =
        0x3181e78fc1b109bc611fd2406150bf06e33faa75f71cba12c3e1fd670f2def00;

    struct Data {
        /// @dev The set of all admins of the wallet.
        EnumerableSet.AddressSet allAdmins;
        /// @dev The set of all signers with permission to use the account.
        EnumerableSet.AddressSet allSigners;
        /// @dev Map from address => whether the address is an admin.
        mapping(address => bool) isAdmin;
        /// @dev Map from signer address => active restrictions for that signer.
        mapping(address => IAccountPermissions.SignerPermissionsStatic) signerPermissions;
        /// @dev Map from signer address => approved target the signer can call using the account contract.
        mapping(address => EnumerableSet.AddressSet) approvedTargets;
        /// @dev Mapping from a signed request UID => whether the request is processed.
        mapping(bytes32 => bool) executed;
    }

    function data() internal pure returns (Data storage data_) {
        bytes32 position = ACCOUNT_PERMISSIONS_STORAGE_POSITION;
        assembly {
            data_.slot := position
        }
    }
}