import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import { ClientStorage } from './client-storage';
import { ClientWebSocket } from './client';

const app = express();

//initialize a simple http server
const server = http.createServer(app);

const storage = new ClientStorage();

//initialize the WebSocket server instance
const wsServer = new WebSocket.Server({server});

wsServer.on('connection', (ws: WebSocket) => {
    const client = ws as ClientWebSocket;
    client.isAlive = true;
    client.room = [];

    client.on('pong', () => {
        client.isAlive = true;
    });

    //connection is up, let's add a simple simple event
    client.on('message', (message: string) => {
        try {
            const jsonMessage = JSON.parse(message);
            if(jsonMessage.join){
                client.room.push(jsonMessage.join)
            }
            if(jsonMessage.room){
                broadcast(message);
            }
            if(jsonMessage.signal){
                broadcast(message);
            }

        } catch (e) {
            console.log('JSON parse erroe: %s', e.name);
        }
    });

    //send immediatly a feedback to the incoming connection
    client.send(JSON.stringify({msg: 'user joined'}));
});


server.on('upgrade', (req, socket) => {
// Make sure that we only handle WebSocket upgrade requests
    if (req.headers['upgrade'] !== 'websocket') {
        socket.end('HTTP/1.1 400 Bad Request');
        return;
    }
// More to come…
});

setInterval(() => {
    wsServer.clients.forEach((ws: WebSocket) => {
        const client = ws as ClientWebSocket;
        if (!client.isAlive) return client.terminate();
        client.isAlive = false;
        client.ping(null, undefined);
    });
}, 10000);


//start our server
server.listen(process.env.PORT || 8999, () => {
    const addressInfo: WebSocket.AddressInfo = server.address() as WebSocket.AddressInfo;
    console.log(`Server started on port ${addressInfo.port} :)`);
});

function broadcast(message: string) {
    wsServer.clients.forEach((ws: WebSocket) => {
        const client = ws as ClientWebSocket;
        if (client.room.indexOf(JSON.parse(message).room) > -1) {
            client.send(message);
        }
    });
}
