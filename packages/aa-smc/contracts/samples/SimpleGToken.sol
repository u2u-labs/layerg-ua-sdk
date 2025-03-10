
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimpleGToken is ERC20 {
    constructor() ERC20("G-TOKEN", "G") {
        uint256 _totalSupply =  1000000000*1e18;
        _mint(msg.sender, _totalSupply);
    }
}