// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./GBaseAccountFactory.sol";
import "./GAccount.sol";
import "../interfaces/IEntryPoint.sol";
import "./upgradeable/ContractMetadata.sol";
import "./upgradeable/PermissionsEnumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract GAccountFactory is GBaseAccountFactory, ContractMetadata, PermissionsEnumerable {

    constructor(
        address _defaultAdmin,
        IEntryPoint _entrypoint
    )
        GBaseAccountFactory(
            address(new GAccount(_entrypoint, address(this))),
            address(_entrypoint)
        )
    {
        _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
    }

    /// @dev Called in `createAccount`. Initializes the account contract created in `createAccount`.
    function _initializeAccount(address _account, address _admin, bytes calldata _data) internal override {
        GAccount(payable(_account)).initialize(_admin, _data);
    }

    /// @dev Returns whether contract metadata can be set in the given execution context.
    function _canSetContractURI() internal view virtual override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Returns the sender in the given execution context.
    function _msgSender() internal view override(Permissions) returns (address) {
        return msg.sender;
    }
}
