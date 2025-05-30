// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../libs/AccountPermissionsStorage.sol";
import "./interfaces/IAccountPermissions.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";


abstract contract GAccountPermissions is IAccountPermissions, EIP712 {
    using ECDSA for bytes32;
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 private constant TYPEHASH =
        keccak256(
            "SignerPermissionRequest(address signer,uint8 isAdmin,address[] approvedTargets,uint128 permissionStartTimestamp,uint128 permissionEndTimestamp,uint128 reqValidityStartTimestamp,uint128 reqValidityEndTimestamp,bytes32 uid)"
        );

    function _onlyAdmin() internal virtual {
        require(isAdmin(msg.sender), "!admin");
    }

    /*///////////////////////////////////////////////////////////////
                            External functions
    //////////////////////////////////////////////////////////////*/

    /// @notice Sets the permissions for a given signer.
    function setPermissionsForSigner(SignerPermissionRequest calldata _req, bytes calldata _signature) external {
        address targetSigner = _req.signer;

        require(
            _req.reqValidityStartTimestamp <= block.timestamp && block.timestamp < _req.reqValidityEndTimestamp,
            "!period"
        );

        (bool success, address signer) = verifySignerPermissionRequest(_req, _signature);
        require(success, "!sig");

        _accountPermissionsStorage().executed[_req.uid] = true;

        //isAdmin > 0, set admin or remove admin
        if (_req.isAdmin > 0) {
            //isAdmin = 1, set admin
            //isAdmin > 1, remove admin
            bool _isAdmin = _req.isAdmin == 1;

            _setAdmin(targetSigner, _isAdmin);
            return;
        }

        require(!isAdmin(targetSigner), "admin");

        _accountPermissionsStorage().allSigners.add(targetSigner);

        _accountPermissionsStorage().signerPermissions[targetSigner] = SignerPermissionsStatic(
            _req.permissionStartTimestamp,
            _req.permissionEndTimestamp
        );

        address[] memory currentTargets = _accountPermissionsStorage().approvedTargets[targetSigner].values();
        uint256 len = currentTargets.length;

        for (uint256 i = 0; i < len; i += 1) {
            _accountPermissionsStorage().approvedTargets[targetSigner].remove(currentTargets[i]);
        }

        len = _req.approvedTargets.length;
        for (uint256 i = 0; i < len; i += 1) {
            _accountPermissionsStorage().approvedTargets[targetSigner].add(_req.approvedTargets[i]);
        }

        _afterSignerPermissionsUpdate(_req);

        emit SignerPermissionsUpdated(signer, targetSigner, _req);
    }

    /*///////////////////////////////////////////////////////////////
                            View functions
    //////////////////////////////////////////////////////////////*/

    /// @notice Returns whether the given account is an admin.
    function isAdmin(address _account) public view virtual returns (bool) {
        return _accountPermissionsStorage().isAdmin[_account];
    }

    /// @notice Returns whether the given account is an active signer on the account.
    function isActiveSigner(address signer) public view returns (bool) {
        SignerPermissionsStatic memory permissions = _accountPermissionsStorage().signerPermissions[signer];

        return
            permissions.startTimestamp <= block.timestamp &&
            block.timestamp < permissions.endTimestamp &&
            _accountPermissionsStorage().approvedTargets[signer].length() > 0;
    }

    /// @notice Returns the restrictions under which a signer can use the smart wallet.
    function getPermissionsForSigner(address signer) external view returns (SignerPermissions memory) {
        SignerPermissionsStatic memory permissions = _accountPermissionsStorage().signerPermissions[signer];

        return
            SignerPermissions(
                signer,
                _accountPermissionsStorage().approvedTargets[signer].values(),
                permissions.startTimestamp,
                permissions.endTimestamp
            );
    }

    /// @dev Verifies that a request is signed by an authorized account.
    function verifySignerPermissionRequest(
        SignerPermissionRequest calldata req,
        bytes calldata signature
    ) public view virtual returns (bool success, address signer) {
        signer = _recoverAddress(_encodeRequest(req), signature);
        success = !_accountPermissionsStorage().executed[req.uid] && isAdmin(signer);
    }

    /// @notice Returns all active and inactive signers of the account.
    function getAllSigners() external view returns (SignerPermissions[] memory signers) {
        address[] memory allSigners = _accountPermissionsStorage().allSigners.values();

        uint256 len = allSigners.length;
        signers = new SignerPermissions[](len);
        for (uint256 i = 0; i < len; i += 1) {
            address signer = allSigners[i];
            SignerPermissionsStatic memory permissions = _accountPermissionsStorage().signerPermissions[signer];

            signers[i] = SignerPermissions(
                signer,
                _accountPermissionsStorage().approvedTargets[signer].values(),
                permissions.startTimestamp,
                permissions.endTimestamp
            );
        }
    }

    /// @notice Returns all signers with active permissions to use the account.
    function getAllActiveSigners() external view returns (SignerPermissions[] memory signers) {
        address[] memory allSigners = _accountPermissionsStorage().allSigners.values();

        uint256 len = allSigners.length;
        uint256 numOfActiveSigners = 0;

        for (uint256 i = 0; i < len; i += 1) {
            if (isActiveSigner(allSigners[i])) {
                numOfActiveSigners++;
            } else {
                allSigners[i] = address(0);
            }
        }

        signers = new SignerPermissions[](numOfActiveSigners);
        uint256 index = 0;
        for (uint256 i = 0; i < len; i += 1) {
            if (allSigners[i] != address(0)) {
                address signer = allSigners[i];
                SignerPermissionsStatic memory permissions = _accountPermissionsStorage().signerPermissions[signer];

                signers[index++] = SignerPermissions(
                    signer,
                    _accountPermissionsStorage().approvedTargets[signer].values(),
                    permissions.startTimestamp,
                    permissions.endTimestamp
                );
            }
        }
    }

    /// @notice Returns all admins of the account.
    function getAllAdmins() external view returns (address[] memory) {
        return _accountPermissionsStorage().allAdmins.values();
    }

    /*///////////////////////////////////////////////////////////////
                        Internal functions
    //////////////////////////////////////////////////////////////*/

    /// @notice Runs after every `changeRole` run.
    function _afterSignerPermissionsUpdate(SignerPermissionRequest calldata _req) internal virtual;

    /// @notice Makes the given account an admin.
    function _setAdmin(address _account, bool _isAdmin) internal virtual {
        _accountPermissionsStorage().isAdmin[_account] = _isAdmin;

        if (_isAdmin) {
            _accountPermissionsStorage().allAdmins.add(_account);
        } else {
            _accountPermissionsStorage().allAdmins.remove(_account);
        }

        emit AdminUpdated(_account, _isAdmin);
    }

    /// @dev Returns the address of the signer of the request.
    function _recoverAddress(bytes memory _encoded, bytes calldata _signature) internal view virtual returns (address) {
        return _hashTypedDataV4(keccak256(_encoded)).recover(_signature);
    }

    /// @dev Encodes a request for recovery of the signer in `recoverAddress`.
    function _encodeRequest(SignerPermissionRequest calldata _req) internal pure virtual returns (bytes memory) {
        return
            abi.encode(
                TYPEHASH,
                _req.signer,
                _req.isAdmin,
                keccak256(abi.encodePacked(_req.approvedTargets)),
                _req.permissionStartTimestamp,
                _req.permissionEndTimestamp,
                _req.reqValidityStartTimestamp,
                _req.reqValidityEndTimestamp,
                _req.uid
            );
    }

    /// @dev Returns the AccountPermissions storage.
    function _accountPermissionsStorage() internal pure returns (AccountPermissionsStorage.Data storage data) {
        data = AccountPermissionsStorage.data();
    }
}
