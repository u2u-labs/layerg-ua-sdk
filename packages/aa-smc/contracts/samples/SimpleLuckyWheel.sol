// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract SimpleLuckyWheel is ReentrancyGuard {
    // Game variables
    IERC20 public token;
    
    // Wheel segments and prizes
    uint8 public constant SEGMENTS = 8;
    uint256[8] public luckyPrizes = [10, 50, 5, 100, 0, 25, 15, 2];
    
    // Random seed components
    uint256 private nonce;
    
    // Spin tracking
    struct Spin {
        address player;
        uint256 timestamp;
        uint256 prize;
        uint256 segment;
    }
    
    // Store all spins
    Spin[] public spinHistory;
    
    // Mapping from player to their spin indices
    mapping(address => uint256[]) public playerSpins;
    
    // Counters
    uint256 public totalSpins;
    uint256 public totalPrizesPaid;
    
    // Events
    event SpinCompleted(address indexed player, uint256 indexed spinIndex, uint256 segment, uint256 prize);
    event PrizePaid(address indexed player, uint256 amount);

    constructor(
        address _token
    ) {
        token = IERC20(_token);
        // Initialize nonce
        nonce = 0;
    }
    
    /**
     * @dev Generate a pseudo-random number
     * Note: This is not cryptographically secure and should be used for entertainment only
     * @return A pseudo-random number
     */
    function _getRandomNumber() private returns (uint256) {
        // Increment nonce
        nonce++;
        
        // Create a random number using various chain data
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            nonce,
            blockhash(block.number - 1)
        )));
    }
    
    /**
     * @dev Spin the wheel and immediately get a result
     * @return The segment that was landed on (0 to SEGMENTS-1)
     */
    function spin() external nonReentrant returns (uint256) {
        
        // Generate random segment
        uint256 randomNumber = _getRandomNumber();
        uint256 segment = randomNumber % SEGMENTS;
        
        // Get prize amount for the segment
        uint256 prize = luckyPrizes[segment] * 10e18;
        // Create spin record
        uint256 spinIndex = spinHistory.length;
        Spin memory newSpin = Spin({
            player: msg.sender,
            timestamp: block.timestamp,
            prize: prize,
            segment: segment
        });
        
        // Store spin data
        spinHistory.push(newSpin);
        playerSpins[msg.sender].push(spinIndex);
        
        // Increment total spins
        totalSpins++;
        
        // Pay prize if non-zero
        if (prize > 0) {
            // Transfer prize tokens to player
            require(token.transfer(msg.sender, prize), "Prize transfer failed");
            
            // Update total prizes paid
            totalPrizesPaid += prize;
            
            emit PrizePaid(msg.sender, prize);
        }
        
        emit SpinCompleted(msg.sender, spinIndex, segment, prize);
        
        return segment;
    }
    
    /**
     * @dev Get player's spin history indices
     * @param _player Player address
     * @return Array of spin indices
     */
    function getPlayerSpinIndices(address _player) external view returns (uint256[] memory) {
        return playerSpins[_player];
    }
    
    function getSpinDetails(uint256 _index) external view returns (
        address player,
        uint256 timestamp,
        uint256 prize,
        uint256 segment
    ) {
        require(_index < spinHistory.length, "Spin index out of bounds");
        Spin memory s = spinHistory[_index];
        return (s.player, s.timestamp, s.prize, s.segment);
    }
    
    function getPlayerSpins(address _player) external view returns (
        uint256[] memory timestamps,
        uint256[] memory prizes,
        uint256[] memory segments
    ) {
        uint256[] memory indices = playerSpins[_player];
        uint256 count = indices.length;
        
        timestamps = new uint256[](count);
        prizes = new uint256[](count);
        segments = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 index = indices[i];
            if (index < spinHistory.length) {
                Spin memory s = spinHistory[index];
                timestamps[i] = s.timestamp;
                prizes[i] = s.prize;
                segments[i] = s.segment;
            }
        }
        
        return (timestamps, prizes, segments);
    }
    
    /**
     * @dev Get all possible prizes
     * @return Array of prize amounts
     */
    function getAllPrizes() external view returns (uint256[SEGMENTS] memory) {
        return luckyPrizes;
    }
    
    /**
     * @dev Get contract balance
     * @return Token balance of the contract
     */
    function getContractBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}