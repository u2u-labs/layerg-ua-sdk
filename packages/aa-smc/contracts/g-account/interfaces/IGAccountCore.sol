// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../interfaces/IAccount.sol";
import "./IAccountPermissions.sol";
import "../../extension/interfaces/IMulticall.sol";

interface IGAccountCore is IAccount, IAccountPermissions, IMulticall {
    /// @dev Returns the address of the factory from which the account was created.
    function factory() external view returns (address);
}