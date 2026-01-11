import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Chainlink Price Feed Addresses (Mantle Sepolia) - lowercase to avoid checksum issues
const CHAINLINK_FEEDS = {
  ETH_USD: "0x694aa1769357215de4a76d8284674857f8225a41",
  BTC_USD: "0x1b44f3514812d835eb1bdb0acb33d5ab6bf37e3e",
  USDC_USD: "0xa2f987a546d4cd2c74239a63e566952d23c915f1",
};

// Mint amounts for testing
const TREASURY_MINT = 10000000n * 10n ** 6n;  // 10M USDC (6 decimals)
const METH_MINT = 100n * 10n ** 18n;          // 100 METH
const FBTC_MINT = 10n * 10n ** 18n;           // 10 FBTC

export default buildModule("DeployProtocol", (m) => {
  // Get deployer account
  const deployer = m.getAccount(0);

  // Mock Tokens
  const meth = m.contract("MockMETH");
  const fbtc = m.contract("MockFBTC");
  const usdc = m.contract("MockStablecoin", ["Mock USDC", "mUSDC", 6]);

  // Production Oracle with Chainlink feeds
  const oracle = m.contract("ProductionPriceOracle");

  // Set Chainlink price feeds
  m.call(oracle, "setPriceFeed", [meth, CHAINLINK_FEEDS.ETH_USD], { id: "setMethFeed" });
  m.call(oracle, "setPriceFeed", [fbtc, CHAINLINK_FEEDS.BTC_USD], { id: "setFbtcFeed" });
  m.call(oracle, "setPriceFeed", [usdc, CHAINLINK_FEEDS.USDC_USD], { id: "setUsdcFeed" });

  // Core Protocol - VaultManager with production oracle
  const vaultManager = m.contract("AutoRepaymentVaultManager", [usdc, oracle]);

  // Configure protocol - add supported collaterals
  m.call(vaultManager, "addSupportedCollateral", [meth], { id: "addMethCollateral" });
  m.call(vaultManager, "addSupportedCollateral", [fbtc], { id: "addFbtcCollateral" });

  // Fund protocol treasury with USDC
  m.call(usdc, "mint", [vaultManager, TREASURY_MINT], { id: "mintTreasuryUsdc" });

  // Mint test tokens to deployer
  m.call(meth, "mint", [deployer, METH_MINT], { id: "mintDeployerMeth" });
  m.call(fbtc, "mint", [deployer, FBTC_MINT], { id: "mintDeployerFbtc" });

  return { vaultManager, meth, fbtc, usdc, oracle };
});
