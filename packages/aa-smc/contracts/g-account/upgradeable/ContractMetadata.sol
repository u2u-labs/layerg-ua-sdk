// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../libs/ContractMetadataStorage.sol";
import "../interfaces/IContractMetadata.sol";

abstract contract ContractMetadata is IContractMetadata {
    /**
     *  @notice         Lets a contract admin set the URI for contract-level metadata.
     *  @dev            Caller should be authorized to setup contractURI, e.g. contract admin.
     *                  See {_canSetContractURI}.
     *                  Emits {ContractURIUpdated Event}.
     *
     *  @param _uri     keccak256 hash of the role. e.g. keccak256("TRANSFER_ROLE")
     */
    function setContractURI(string memory _uri) external override {
        if (!_canSetContractURI()) {
            revert("Not authorized");
        }

        _setupContractURI(_uri);
    }

    /// @dev Lets a contract admin set the URI for contract-level metadata.
    function _setupContractURI(string memory _uri) internal {
        string memory prevURI = _contractMetadataStorage().contractURI;
        _contractMetadataStorage().contractURI = _uri;

        emit ContractURIUpdated(prevURI, _uri);
    }

    /// @notice Returns the contract metadata URI.
    function contractURI() public view virtual override returns (string memory) {
        return _contractMetadataStorage().contractURI;
    }

    /// @dev Returns the AccountPermissions storage.
    function _contractMetadataStorage() internal pure returns (ContractMetadataStorage.Data storage data) {
        data = ContractMetadataStorage.data();
    }

    /// @dev Returns whether contract metadata can be set in the given execution context.
    function _canSetContractURI() internal view virtual returns (bool);
}

