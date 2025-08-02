// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CafeEventLedger
 * @dev A minimalist on-chain event log and fee management contract designed for "Time Cafe".
 * - No tokens involved; all operations are about paying a fee and emitting an event.
 * - The events themselves serve as the permanent record of operations.
 * - The contract owner can set the fees for various operations and withdraw the accumulated funds.
 */
contract CafeEventLedger is Ownable {

    // --- Event Definitions (Events are everything now) ---

    // Event for user messages
    event NewMessage(
        address indexed sender,
        string messageContent,
        uint256 timestamp
    );
    
    // Event for purchasing coffee (for oneself or others)
    event CoffeePurchased(
        address indexed buyer,
        address indexed recipient, // The person receiving the coffee
        string message, // Accompanying well-wishes
        uint256 cost,
        uint256 timestamp
    );

    // Event for sending a generic gift
    event GiftSent(
        address indexed sender,
        address indexed recipient,
        string giftName, // Name of the gift, e.g., "A Rose"
        string message,
        uint256 timestamp
    );

    // Event for changing a song
    event SongChanged(
        address indexed changer,
        string songId,
        string songTitle,
        uint256 cost,
        uint256 timestamp
    );

    // --- State Variables ---

    // Fees for various operations (in wei of the native token)
    uint256 public buyCoffeeCost;
    uint256 public sendGiftCost;
    uint256 public changeSongCost;
    // Posting a message can be free, so no fee variable is set for it.

    // --- Constructor ---
    constructor(
        uint256 _initialBuyCoffeeCost,
        uint256 _initialSendGiftCost
    ) Ownable(msg.sender) {
        buyCoffeeCost = _initialBuyCoffeeCost;
        sendGiftCost = _initialSendGiftCost;
    }

    // --- Core Functions ---

    /**
     * @dev Posts a message. This operation is free.
     * @param _messageContent The text content of the message.
     */
    function postMessage(string calldata _messageContent) external {
        emit NewMessage(msg.sender, _messageContent, block.timestamp);
    }
    
    /**
     * @dev Buys a coffee for someone (can also be for oneself).
     * @param _recipient The address of the person receiving the coffee.
     * @param _message Accompanying well-wishes.
     */
    function buyCoffee(address _recipient, string calldata _message) external payable {
        require(msg.value == buyCoffeeCost, "Incorrect payment for buying coffee");
        emit CoffeePurchased(msg.sender, _recipient, _message, msg.value, block.timestamp);
    }

    /**
     * @dev Sends a gift to someone.
     * @param _recipient The address of the person receiving the gift.
     * @param _giftName The name of the gift, defined by the frontend (e.g., "a bouquet of flowers", "a star").
     * @param _message Accompanying well-wishes.
     */
    function sendGift(address _recipient, string calldata _giftName, string calldata _message) external payable {
        emit GiftSent(msg.sender, _recipient, _giftName, _message, block.timestamp);
    }

    /**
     * @dev Changes the song.
     * @param _songId The unique identifier for the new song.
     * @param _songTitle The title of the new song.
     */
    function changeSong(string calldata _songId, string calldata _songTitle) external payable {
        require(msg.value == changeSongCost, "Incorrect payment for changing song");
        emit SongChanged(msg.sender, _songId, _songTitle, msg.value, block.timestamp);
    }

    // --- Owner Functions ---

    /**
     * @dev Withdraws all accumulated fees from the contract.
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Sets the new fees for various operations.
     */
    function setCosts(uint256 _newBuyCoffeeCost, uint256 _newSendGiftCost, uint256 _newChangeSongCost) external onlyOwner {
        buyCoffeeCost = _newBuyCoffeeCost;
        sendGiftCost = _newSendGiftCost;
        changeSongCost = _newChangeSongCost;
    }

    // Function to receive native currency
    receive() external payable {}
}