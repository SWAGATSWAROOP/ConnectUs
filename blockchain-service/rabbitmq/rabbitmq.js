const amqp = require("amqplib");
const {
  createUser,
  withdrawTokens,
  transferClientToken,
} = require("../blockChainFunctions/index.js");

async function connect() {
  try {
    const connection = await amqp.connect("amqp://localhost:5672");
    const channel = await connection.createChannel();

    await channel.assertQueue("blockChainJobs", {
      durable: true,
      maxPriority: 10,
    });

    console.log("Waiting for messages...");

    async function fetchMessage() {
      const message = await channel.get("blockChainJobs", { noAck: false });
      if (message) {
        const msgContent = JSON.parse(message.content.toString());
        console.log(`Received job with input ${msgContent.type}`);
        if (msgContent.type == "create-user") {
          await createUser(msgContent.email, msgContent.address);
        } else if (msgContent.type == "withdraw-request") {
          await withdrawTokens(msgContent.amount, msgContent.email);
        } else if (msgContent.type == "getreward") {
          await transferClientToken(msgContent.email);
        }
        channel.ack(message);
      } else {
        console.log("No messages in queue");
      }
    }

    setInterval(fetchMessage, 5000);
  } catch (error) {
    console.error(error);
  }
}

module.exports = { connect };
