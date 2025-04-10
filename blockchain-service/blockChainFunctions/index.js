const { ethers } = require("hardhat");
const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });

const TokenContract = require("../artifacts/contracts/User.sol/ConnectUsToken.json");

const initializeContract = (view = false) => {
  const provider = new ethers.JsonRpcProvider();
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  const walletConnected = wallet.connect(provider);

  const signerOrProvider = view ? provider : walletConnected;
  return new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    TokenContract.abi,
    signerOrProvider
  );
};

// Create a new user
const createUser = async (email, userAddress) => {
  try {
    const contract = initializeContract();
    const tx = await contract.createUser(email, userAddress);
    await tx.wait();
    console.log(`User ${email} created.`);
    return true;
  } catch (err) {
    console.error("Error creating user:", err);
    return false;
  }
};

// Mint tokens to an account
const mintTokens = async (toAddress, amount) => {
  try {
    const contract = initializeContract();
    const tx = await contract.mint(toAddress, amount);
    await tx.wait();
    console.log(`Minted ${amount} tokens to ${toAddress}`);
    return true;
  } catch (err) {
    console.error("Error minting tokens:", err);
    return false;
  }
};

// Burn tokens from an account
const burnTokens = async (fromAddress, amount) => {
  try {
    const contract = initializeContract();
    const tx = await contract.burn(fromAddress, amount);
    await tx.wait();
    console.log(`Burned ${amount} tokens from ${fromAddress}`);
    return true;
  } catch (err) {
    console.error("Error burning tokens:", err);
    return false;
  }
};

// Transfer 1 token to a client
const transferClientToken = async (email) => {
  try {
    const contract = initializeContract();
    const tx = await contract.transferClient(email);
    await tx.wait();
    console.log(`Transferred 1 token to user with email: ${email}`);
    return true;
  } catch (err) {
    console.error("Error transferring token to client:", err);
    return false;
  }
};

// Withdraw tokens for ETH
const withdrawTokens = async (tokenAmount, email) => {
  try {
    const contract = initializeContract();
    const tx = await contract.withdraw(tokenAmount, email);
    await tx.wait();
    console.log(`Withdrew ${tokenAmount} tokens for user ${email}`);
    return true;
  } catch (err) {
    console.error("Error withdrawing tokens:", err);
    return false;
  }
};

// Donate ETH to contract
const donateEth = async (amountInEth) => {
  try {
    const contract = initializeContract();
    const tx = await contract.donateMoney({
      value: ethers.parseEther(amountInEth.toString()),
    });
    await tx.wait();
    console.log(`Donated ${amountInEth} ETH`);
    return true;
  } catch (err) {
    console.error("Error donating ETH:", err);
    return false;
  }
};

const getTokenBalance = async (email) => {
  try {
    const contract = initializeContract(true);
    const balance = await contract.getTokenBalance(email);
    console.log(`Token balance for ${email}: ${balance}`);
    return balance;
  } catch (err) {
    console.error("Error fetching token balance:", err);
    return null;
  }
};

module.exports = {
  createUser,
  mintTokens,
  burnTokens,
  transferClientToken,
  withdrawTokens,
  donateEth,
  getTokenBalance,
};
