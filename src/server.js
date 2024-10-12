const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const PORT = 5000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    },
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });

    socket.on('chatMessage', (message) => {
        io.emit('chatMessage', message);
    });
})

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});