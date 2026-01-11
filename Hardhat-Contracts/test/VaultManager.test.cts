import { expect } from "chai";
import { ethers } from "hardhat";
// Note: Skipping time-based yield tests due to mock design
// The mock tracks yield per address, but collateral is held by VaultManager

describe("AutoRepaymentVaultManager", function () {
  let vaultManager: any, meth: any, usdc: any, oracle: any, owner: any, user1: any, keeper: any;

  const COLLATERAL_AMOUNT = ethers.parseEther("10");
  const BORROW_AMOUNT = ethers.parseUnits("7000", 6); // 70% LTV

  beforeEach(async function () {
    [owner, user1, keeper] = await ethers.getSigners();

    const MockMETH = await ethers.getContractFactory("MockMETH");
    meth = await MockMETH.deploy();

    const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
    usdc = await MockStablecoin.deploy("Mock USDC", "mUSDC", 6);

    const SimplePriceOracle = await ethers.getContractFactory("SimplePriceOracle");
    oracle = await SimplePriceOracle.deploy();

    const AutoRepaymentVaultManager = await ethers.getContractFactory("AutoRepaymentVaultManager");
    vaultManager = await AutoRepaymentVaultManager.deploy(usdc.target, oracle.target);

    // Setup
    await vaultManager.addSupportedCollateral(meth.target);
    await oracle.setPrice(meth.target, ethers.parseEther("3000"));
    await oracle.setPrice(usdc.target, ethers.parseEther("1"));
    await usdc.mint(vaultManager.target, ethers.parseUnits("10000000", 6));
    await meth.mint(user1.address, COLLATERAL_AMOUNT);
  });

  describe("Core Functionality", () => {
    it("Should deposit collateral and borrow stablecoins", async () => {
      await meth.connect(user1).approve(vaultManager.target, COLLATERAL_AMOUNT);
      await vaultManager.connect(user1).depositCollateralAndBorrow(
        meth.target, COLLATERAL_AMOUNT, BORROW_AMOUNT
      );

      const vaultInfo = await vaultManager.getVaultInfo(user1.address);
      expect(vaultInfo.debt).to.equal(BORROW_AMOUNT);
      expect(vaultInfo.collateral).to.equal(COLLATERAL_AMOUNT);
      expect(await usdc.balanceOf(user1.address)).to.equal(BORROW_AMOUNT);
    });

    it("Should calculate correct health factor", async () => {
      await meth.connect(user1).approve(vaultManager.target, COLLATERAL_AMOUNT);
      await vaultManager.connect(user1).depositCollateralAndBorrow(
        meth.target, COLLATERAL_AMOUNT, BORROW_AMOUNT
      );

      const vaultInfo = await vaultManager.getVaultInfo(user1.address);
      // 10 ETH * $3000 = $30,000 collateral
      // $7,000 debt
      // Health factor = 30000 / 7000 * 100 ≈ 428%
      expect(vaultInfo.healthFactor > 400n).to.be.true;
    });

    it("Should add keeper correctly", async () => {
      await vaultManager.addKeeper(keeper.address);
      expect(await vaultManager.keepers(keeper.address)).to.equal(true);
    });

    it("Should track vault in allVaultOwners", async () => {
      await meth.connect(user1).approve(vaultManager.target, COLLATERAL_AMOUNT);
      await vaultManager.connect(user1).depositCollateralAndBorrow(
        meth.target, COLLATERAL_AMOUNT, BORROW_AMOUNT
      );

      const owners = await vaultManager.getAllVaultOwners(0, 10);
      expect(owners.length).to.equal(1);
      expect(owners[0]).to.equal(user1.address);
      expect(await vaultManager.totalVaults()).to.equal(1n);
    });

    it("Should reject unauthorized keeper calls", async () => {
      await meth.connect(user1).approve(vaultManager.target, COLLATERAL_AMOUNT);
      await vaultManager.connect(user1).depositCollateralAndBorrow(
        meth.target, COLLATERAL_AMOUNT, BORROW_AMOUNT
      );

      // user1 is not a keeper, should fail
      let failed = false;
      try {
        await vaultManager.connect(user1).processAutoRepayment(user1.address);
      } catch (e) {
        failed = true;
      }
      expect(failed).to.equal(true);
    });

    it("Should reject duplicate vault creation", async () => {
      await meth.connect(user1).approve(vaultManager.target, COLLATERAL_AMOUNT);
      await vaultManager.connect(user1).depositCollateralAndBorrow(
        meth.target, COLLATERAL_AMOUNT, BORROW_AMOUNT
      );

      // Mint more tokens and try again
      await meth.mint(user1.address, COLLATERAL_AMOUNT);
      await meth.connect(user1).approve(vaultManager.target, COLLATERAL_AMOUNT);

      let failed = false;
      try {
        await vaultManager.connect(user1).depositCollateralAndBorrow(
          meth.target, COLLATERAL_AMOUNT, BORROW_AMOUNT
        );
      } catch (e) {
        failed = true;
      }
      expect(failed).to.equal(true);
    });
  });
});
