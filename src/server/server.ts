import path from 'path';
import express from 'express';
import http from 'http';
//const Game = require('./game');
const Socketio = require('socket.io');
const Constsants = require('../shared/constants');


// Serve up the static files from public
const app = express();
app.use(express.static('public')); 
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

// Start listening for people to connect
const ip = process.env.IP || "localhost";
const port = process.env.PORT || 3000;
const server = http.createServer(app).listen(port, () => {
    console.log("Server started:  http://" + ip + ":" + port);
});

// Start Socket.io connection
const websocket = Socketio(server);
websocket.on('connection', socket => {
  console.log('Player connected!', socket.id);
});

// Start the game
//const game = new Game();