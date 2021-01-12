import * as WebSocket from 'ws';

export interface ClientWebSocket extends WebSocket {
    isAlive: boolean;
    room: string[];
}
