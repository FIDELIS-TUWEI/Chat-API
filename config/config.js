require('dotenv').config();

module.exports = {
  development: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: 'postgres',  // This is the name of the Docker service
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  },
};