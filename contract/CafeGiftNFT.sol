// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "base64-sol/base64.sol";

/**
 * @title CafeGiftNFT
 * @dev A contract allowing users to pay a fee to mint a unique gift NFT for someone else.
 * - Each gift is an ERC721 standard NFT.
 * - The NFT is minted directly to the recipient's wallet address.
 * - The NFT's metadata (name, description, image) is dynamically generated on-chain.
 */
contract CafeGiftNFT is ERC721, Ownable {

    // --- State Variables ---
    uint256 public giftCost; // The cost to send one gift NFT
    uint256 private _nextTokenId; // Used to generate unique NFT IDs

    // Stores additional information for each NFT
    struct GiftDetails {
        address sender;
        address recipient;
        string message;
        uint256 timestamp;
    }
    mapping(uint256 => GiftDetails) public giftDetails;

    // --- Events ---
    event GiftNFTMinted(
        uint256 indexed tokenId,
        address indexed sender,
        address indexed recipient,
        string message
    );

    // --- Constructor ---
    constructor(
        uint256 _initialGiftCost
    ) ERC721("Time Capsule Cafe Gifts", "TCG") Ownable(msg.sender) {
        giftCost = _initialGiftCost;
    }

    // --- Core Function ---
    /**
     * @dev Pays a fee to mint a gift NFT with a message for a specified recipient.
     * @param _recipient The address of the person receiving the NFT.
     * @param _message The message to be included on the NFT.
     */
    function sendGiftNFT(address _recipient, string memory _message) external payable {
        require(msg.value == giftCost, "Incorrect payment for gift NFT");
        
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        // Store the details of the gift
        giftDetails[tokenId] = GiftDetails({
            sender: msg.sender,
            recipient: _recipient,
            message: _message,
            timestamp: block.timestamp
        });

        // The most important step: mint the NFT directly to the recipient
        _safeMint(_recipient, tokenId);

        emit GiftNFTMinted(tokenId, msg.sender, _recipient, _message);
    }
    
    // --- Metadata Function (to display correctly in wallets/marketplaces) ---
    /**
     * @dev Overridden to return dynamically generated, on-chain metadata.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC721: URI query for nonexistent token");

        GiftDetails memory details = giftDetails[tokenId];

        // [FIXED] Removed the second argument from toHexString
        string memory name = string(abi.encodePacked("A Gift from ", Strings.toHexString(details.sender)));
        
        // [FIXED] Removed the second argument from toHexString
        string memory description = string(abi.encodePacked("'", details.message, "' - A special gift for ", Strings.toHexString(details.recipient), " minted on ", Strings.toString(details.timestamp), "."));
        
        // Dynamically generate an SVG image
        string memory image = Base64.encode(bytes(
            string(abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" style="background-color:#f0e9e0;">',
                '<rect width="100%" height="100%" fill="#f0e9e0"/>',

                // Gift Box
                '<rect x="50" y="100" width="200" height="100" fill="#e91e63"/>', // Box
                '<rect x="50" y="90" width="200" height="20" fill="#c2185b"/>',  // Top Ribbon (Horizontal)
                '<rect x="140" y="70" width="20" height="120" fill="#c2185b"/>', // Top Ribbon (Vertical)

                // Bow
                '<polygon points="130,70 150,50 170,70" fill="#f48fb1"/>',
                '<polygon points="130,70 150,90 170,70" fill="#f48fb1"/>',

                // Message Text
                '<text x="150" y="230" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="16px" fill="#5c3a21">',
                details.message,
                '</text>',

                // Sender Text
                '<text x="150" y="270" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="12px" fill="#795548">From: ',
                Strings.toHexString(details.sender),
                '</text>',

                '</svg>'
            ))
        ));

        // Package all metadata into a Base64 encoded JSON
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(abi.encodePacked(
                '{',
                '"name":"', name, '",',
                '"description":"', description, '",',
                '"image": "data:image/svg+xml;base64,', image, '"',
                '}'
            )))
        ));
    }

    // --- Owner Functions ---
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    function setGiftCost(uint256 _newCost) external onlyOwner {
        giftCost = _newCost;
    }
}