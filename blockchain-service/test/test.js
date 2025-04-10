const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ConnectUsToken", function () {
  let token;
  let owner;
  let user1;
  let user2;

  const initialSupply = 10000n; // Use BigInt
  const TOKEN_DECIMALS = 10n ** 18n;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const ConnectUsTokenFactory = await ethers.getContractFactory(
      "ConnectUsToken"
    );
    token = await ConnectUsTokenFactory.deploy(initialSupply);
    await token.waitForDeployment();
  });

  it("should deploy with correct initial supply and owner", async function () {
    const total = await token.totalSupply();
    expect(total).to.equal(initialSupply * TOKEN_DECIMALS);

    const balance = await token.balanceOf(owner.address);
    expect(balance).to.equal(initialSupply * TOKEN_DECIMALS);
  });

  it("should create a new user", async function () {
    const email = "user1@example.com";
    const tx = await token.createUser(email, user1.address);
    await tx.wait();

    expect(await token.noOfUsers()).to.equal(1n);
  });

  it("should not allow creating the same user twice", async function () {
    const email = "duplicate@example.com";
    await token.createUser(email, user1.address);

    await expect(token.createUser(email, user1.address)).to.be.revertedWith(
      "User already exists"
    );
  });

  it("should mint new tokens", async function () {
    const mintAmount = 500n;
    await token.mint(user1.address, mintAmount);

    const balance = await token.balanceOf(user1.address);
    expect(balance).to.equal(mintAmount * TOKEN_DECIMALS);
  });

  it("should burn tokens", async function () {
    const burnAmount = 100n;
    await token.mint(user1.address, burnAmount);
    await token.burn(user1.address, burnAmount);

    const balance = await token.balanceOf(user1.address);
    expect(balance).to.equal(0n);
  });

  it("should transfer 1 token to a user via transferClient", async function () {
    const email = "user2@example.com";
    await token.createUser(email, user2.address);

    // reduce totalSupplyConnectUs to trigger minting
    const burnAmount = initialSupply - 5n;
    await token.burn(owner.address, burnAmount);

    await token.transferClient(email);

    const balance = await token.balanceOf(user2.address);
    expect(balance).to.equal(1n * TOKEN_DECIMALS);
  });

  it("should accept ETH donations", async function () {
    const donation = ethers.parseEther("1");

    const tx = await token.connect(user1).donateMoney({ value: donation });
    await tx.wait();

    const contractBalance = await ethers.provider.getBalance(
      (await token.getAddress?.()) || token.target || token.address
    );
    expect(contractBalance).to.equal(donation);
  });

  it("should allow token withdrawal for ETH", async function () {
    const email = "withdraw@example.com";
    await token.createUser(email, user1.address);

    await token.transferClient(email);

    const donation = ethers.parseEther("10");
    await token.connect(owner).donateMoney({ value: donation });

    const beforeBalance = await ethers.provider.getBalance(user1.address);

    const tx = await token.withdraw(1, email);
    await tx.wait();

    const afterBalance = await ethers.provider.getBalance(user1.address);
    expect(afterBalance).to.be.gt(beforeBalance);
  });
});
