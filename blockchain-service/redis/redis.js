const Redis = require("ioredis");

if (!global.redis) {
  console.log("Initializing Redis");
  global.redis = new Redis(process.env.REDIS_URL);
  console.log("Redis Initialized");
} else {
  console.log("Reusing Connection");
}

const redis = global.redis;

export default redis;
