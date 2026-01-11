// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockStablecoin is ERC20, Ownable {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    // Mint function for testing
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // Faucet function for easy testing
    function faucet(uint256 amount) external {
        require(amount <= 10000 * 10 ** _decimals, "Max 10k per request");
        _mint(msg.sender, amount);
    }
}
