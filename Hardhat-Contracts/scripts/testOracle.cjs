const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const RPC_URL = process.env.MANTLE_SEPOLIA_RPC_URL || "https://rpc.sepolia.mantle.xyz";
    const ORACLE_ADDRESS = "0x1541453CA322fe67A818277C5f58E31678b33fe9";
    const METH_ADDRESS = "0xcb8d5d8568c943fB79A529c8a3ccb4434892a7Ab";

    console.log("🔍 Testing ProductionPriceOracle on Mantle Sepolia...\n");
    console.log(`RPC: ${RPC_URL}`);
    console.log(`Oracle: ${ORACLE_ADDRESS}\n`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    const oracleAbi = [
        "function priceFeeds(address) view returns (address)",
        "function getLatestPrice(address) view returns (uint256)",
        "function getAssetValue(address, uint256) view returns (uint256)"
    ];

    const oracle = new ethers.Contract(ORACLE_ADDRESS, oracleAbi, provider);

    try {
        console.log("📊 Testing mETH price feed...");

        // Check price feed address
        const feedAddr = await oracle.priceFeeds(METH_ADDRESS);
        console.log(`   Chainlink Feed: ${feedAddr}`);

        if (feedAddr === ethers.ZeroAddress) {
            console.log("   ❌ No price feed configured");
        } else {
            // Try to get price
            try {
                const price = await oracle.getLatestPrice(METH_ADDRESS);
                console.log(`   Raw Price (8 decimals): ${price.toString()}`);
                console.log(`   Price USD: $${Number(price) / 1e8}`);
                console.log("   ✅ Oracle is working!");
            } catch (priceErr) {
                console.log(`   ⚠️ getLatestPrice failed: ${priceErr.message}`);
                console.log("   → This likely means the Chainlink feed address is incorrect for Mantle Sepolia");
            }
        }
    } catch (err) {
        console.log(`❌ Error: ${err.message}`);
    }
}

main();
