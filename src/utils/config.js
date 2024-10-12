require("dotenv").config();

let PORT = process.env.PORT;
let POSTGRES_USER = process.env.POSTGRES_USER;
let POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
let POSTGRES_DB = process.env.POSTGRES_DB;
let POSTGRES_HOST = process.env.POSTGRES_HOST;
let POSTGRES_PORT = process.env.POSTGRES_PORT;
let REDIS_HOST = process.env.REDIS_HOST;
let REDIS_PORT = process.env.REDIS_PORT;

module.exports = {
    PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT,
    REDIS_HOST, REDIS_PORT
}