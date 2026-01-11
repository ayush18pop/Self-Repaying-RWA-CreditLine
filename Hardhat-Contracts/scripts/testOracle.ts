import { ethers } from "hardhat";

async function main() {
    const ORACLE_ADDRESS = "0x1541453CA322fe67A818277C5f58E31678b33fe9";
    const METH_ADDRESS = "0xcb8d5d8568c943fB79A529c8a3ccb4434892a7Ab";
    const FBTC_ADDRESS = "0xac751010C6eCF85422152C5Efe5640a9e1876778";
    const USDC_ADDRESS = "0xb6cAcDd9D0dD64d41B06508CaB3A517Add796916";

    console.log("🔍 Testing ProductionPriceOracle on Mantle Sepolia...\n");

    const oracle = await ethers.getContractAt("ProductionPriceOracle", ORACLE_ADDRESS);

    const assets = [
        { name: "mETH", address: METH_ADDRESS, amount: ethers.parseEther("1") },
        { name: "fBTC", address: FBTC_ADDRESS, amount: ethers.parseEther("1") },
        { name: "USDC", address: USDC_ADDRESS, amount: ethers.parseUnits("1", 6) },
    ];

    for (const asset of assets) {
        try {
            console.log(`📊 Testing ${asset.name}...`);

            // Check if price feed is set
            const priceFeed = await oracle.priceFeeds(asset.address);
            console.log(`   Feed address: ${priceFeed}`);

            if (priceFeed === ethers.ZeroAddress) {
                console.log(`   ❌ No price feed set for ${asset.name}\n`);
                continue;
            }

            // Try to get the price
            const price = await oracle.getLatestPrice(asset.address);
            console.log(`   Price (8 decimals): ${price}`);
            console.log(`   Price USD: $${Number(price) / 1e8}`);

            // Get asset value for 1 unit
            const value = await oracle.getAssetValue(asset.address, asset.amount);
            console.log(`   Value of 1 ${asset.name}: $${ethers.formatEther(value)}`);
            console.log(`   ✅ ${asset.name} oracle working!\n`);
        } catch (error: any) {
            console.log(`   ❌ Error: ${error.message}\n`);
        }
    }
}

main().catch(console.error);
