const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Deploy", (m) => {
  const initialSupply = 10000; // or whatever number you want
  const connectUsToken = m.contract("ConnectUsToken", [initialSupply]);

  return { connectUsToken };
});
