// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../interfaces/PackedUserOperation.sol";
import "../core/UserOperationLib.sol";

contract TestUtil {
    using UserOperationLib for PackedUserOperation;

    function encodeUserOp(PackedUserOperation calldata op) external pure returns (bytes memory){
        return op.encode();
    }

}
