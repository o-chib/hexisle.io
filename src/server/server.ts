import path from 'path';
import express from 'express';
import http from 'http';

import {clientConnection} from './clientConnection';

const app = express();
const server = http.createServer(app);  
const websocket = require('socket.io')(server);

// Serve up the static files from public
app.use(express.static('public')); 
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

// Start listening for people to connect
const ip = process.env.IP || "localhost";
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log("Server started:  http://" + ip + ":" + port);
});

// Start Socket.io connection
clientConnection(websocket);