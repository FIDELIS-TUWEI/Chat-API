const redis = require("redis");

const client = redis.createClient();

client.on('error', (err) => console.error("Redis client error", err));
client.on('connect', () => console.log("Connected to Redis"));

client.connect();

module.exports = client;