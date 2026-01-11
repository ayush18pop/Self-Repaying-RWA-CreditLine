import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Testing with:", deployer.address);

  // Replace with your deployed addresses
  const VAULT_MANAGER = "0x...";
  const METH = "0x...";

  const VaultManager = await ethers.getContractAt("AutoRepaymentVaultManager", VAULT_MANAGER);
  const Meth = await ethers.getContractAt("MockMETH", METH);

  const collateral = ethers.parseEther("1");
  const borrow = ethers.parseUnits("7000", 6);

  // Deposit & borrow
  await Meth.approve(VAULT_MANAGER, collateral);
  await VaultManager.depositCollateralAndBorrow(METH, collateral, borrow);

  console.log("✅ User flow complete!");
}

main().catch(console.error);
