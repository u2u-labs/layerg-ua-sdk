// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./IGAccountFactoryCore.sol";

interface IGAccountFactory is IGAccountFactoryCore {
    /*///////////////////////////////////////////////////////////////
                        Callback Functions
    //////////////////////////////////////////////////////////////*/

    /// @notice Callback function for an Account to register its signers.
    function onSignerAdded(address signer, bytes32 salt) external;

    /// @notice Callback function for an Account to un-register its signers.
    function onSignerRemoved(address signer, bytes32 salt) external;
}
