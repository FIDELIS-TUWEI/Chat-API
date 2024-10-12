const redis = require("redis");
const config = require("../utils/config");

const client = redis.createClient({
    url: config.REDIS_URL || 'redis://redis:6379'
});

client.on('error', (err) => console.error("Redis client error", err));
client.on('connect', () => console.log("Connected to Redis"));

client.connect();

module.exports = client;