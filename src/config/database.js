const { Sequelize } = require("sequelize");
const config = require("../utils/config");

const sequelize = new Sequelize(config.POSTGRES_DB, config.POSTGRES_USER, config.POSTGRES_PASSWORD, {
    host: config.POSTGRES_HOST || 'localhost',
    port: config.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = sequelize;