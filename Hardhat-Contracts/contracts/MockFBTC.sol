// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockFBTC is ERC20, Ownable {
    // Annual yield rate: 2.5% (250 basis points)
    uint256 public constant YIELD_RATE = 250; // 2.5%
    uint256 public constant RATE_DENOMINATOR = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    struct UserYield {
        uint256 balance;
        uint256 lastUpdateTime;
        uint256 accumulatedYield;
    }

    mapping(address => UserYield) public userYields;

    event YieldAccumulated(address indexed user, uint256 amount);
    event YieldClaimed(address indexed user, uint256 amount);

    constructor() ERC20("Mock Mantle BTC", "fBTC") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
        _updateYield(to);
        userYields[to].balance += amount;
    }

    function transfer(
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        _updateYield(msg.sender);
        _updateYield(to);

        userYields[msg.sender].balance -= amount;
        userYields[to].balance += amount;

        return super.transfer(to, amount);
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        _updateYield(from);
        _updateYield(to);

        userYields[from].balance -= amount;
        userYields[to].balance += amount;

        return super.transferFrom(from, to, amount);
    }

    function getPendingYield(address user) public view returns (uint256) {
        UserYield memory userYield = userYields[user];

        if (userYield.balance == 0) {
            return userYield.accumulatedYield;
        }

        uint256 timeElapsed = block.timestamp - userYield.lastUpdateTime;
        uint256 newYield = (userYield.balance * YIELD_RATE * timeElapsed) /
            (RATE_DENOMINATOR * SECONDS_PER_YEAR);

        return userYield.accumulatedYield + newYield;
    }

    function _updateYield(address user) internal {
        if (userYields[user].lastUpdateTime == 0) {
            userYields[user].lastUpdateTime = block.timestamp;
            return;
        }

        uint256 pending = getPendingYield(user);
        userYields[user].accumulatedYield = pending;
        userYields[user].lastUpdateTime = block.timestamp;

        if (pending > 0) {
            emit YieldAccumulated(user, pending);
        }
    }

    function claimYield(address user) external returns (uint256) {
        _updateYield(user);

        uint256 yieldAmount = userYields[user].accumulatedYield;
        require(yieldAmount > 0, "No yield to claim");

        userYields[user].accumulatedYield = 0;

        _mint(msg.sender, yieldAmount);

        emit YieldClaimed(user, yieldAmount);
        return yieldAmount;
    }

    function updateMyYield() external {
        _updateYield(msg.sender);
    }
}
