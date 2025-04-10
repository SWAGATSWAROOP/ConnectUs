const express = require("express");
const app = express();
const { blockChainGrpcClient } = require("./grpc/main.js");
const { connect } = require("./rabbitmq/rabbitmq.js");
const { getTokenBalance } = require("./blockChainFunctions/index.js");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connect();

app.get("/health-check", (req, res) => {
  res.status(200).json({ message: "Working Fine" });
});

app.get("/token/:email", async (req, res) => {
  try {
    const email = req.params.email;
    let exists = false;
    blockChainGrpcClient.checkIfUserExists(
      { email: email },
      (err, response) => {
        let { checkExistance } = JSON.parse(response);
        exists = checkExistance;
      }
    );
    if (!exists)
      return response.status(400).json({ message: "User Doesn't exist" });
    const tokenBalance = await getTokenBalance(email);
    res.status(200).json({
      message: `Balance of the token is ${tokenBalance}`,
      tokenBalance,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Failed to perform operation" });
  }
});

app.listen(3000, () => {
  console.log(`Server running on port ${3000}`);
});
