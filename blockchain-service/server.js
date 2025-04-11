const cluster = require("cluster");
const os = require("os");

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
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

      // Wrap gRPC call in a promise to await it properly
      const exists = await new Promise((resolve, reject) => {
        blockChainGrpcClient.checkIfUserExists({ email }, (err, response) => {
          if (err) return reject(err);
          try {
            const { checkExistance } = JSON.parse(response);
            resolve(checkExistance);
          } catch (e) {
            reject(e);
          }
        });
      });

      if (!exists) {
        return res.status(400).json({ message: "User Doesn't exist" });
      }

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
    console.log(`Worker ${process.pid} running on port 3000`);
  });
}
