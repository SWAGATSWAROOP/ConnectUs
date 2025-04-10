const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const packageDef = protoLoader.loadSync("blockchain.proto", {});
const grpcObject = grpc.loadPackageDefinition(packageDef);
const blockChainPackage = grpcObject.blockchainPackage;

const blockChainGrpcClient = new blockChainPackage.UserService(
  "localhost:4000",
  grpc.credentials.createInsecure()
);

module.exports = { blockChainGrpcClient };
