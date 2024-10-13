const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const config = require("./utils/config");
const { testConnection, createTables, checkTablesExist } = require("../database/db");

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    },
});

const startServer = async () => {
    try {
        const connected = await testConnection();
        if (!connected) {
            console.error('Failed to connect to the database. Exiting...');
            process.exit(1);
        }
        
        const tablesExist = await checkTablesExist();
        if (!tablesExist) {
            await createTables();
            console.log('Database tables created successfully');
        } else {
            console.log('Database tables already exist, skipping creation...');
        }

        server.listen(config.PORT, () => {
            console.log(`Server running on port: ${config.PORT}`);
        });
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
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