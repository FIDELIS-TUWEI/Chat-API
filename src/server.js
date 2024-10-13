const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const sequelize = require("./config/database");
const config = require("./utils/config");

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    },
});

// Test database connection before starting the server
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Sync the database models
        await sequelize.sync(); // Sync models to create tables if not exist

        // Start the server only if the database connection is successful
        server.listen(config.PORT, () => {
            console.log(`Server running on port: ${config.PORT}`);
        });
    } catch (err) {
        console.error('Unable to connect to the database:', err);
        process.exit(1); // Exit the process if the DB connection fails
    }
};

startServer();

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });

    socket.on('chatMessage', (message) => {
        io.emit('chatMessage', message);
    });
});