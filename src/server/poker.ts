import { WebSocket } from "ws";
import type { Message } from "../types.ts";

interface User {
	id: string;
	name: string
}

const clients = new Set<WebSocket>();
const users = new Map<WebSocket, User>();

export const handleConnection = (ws: WebSocket) => {
    clients.add(ws);
};

export const handleDisconnect = (ws: WebSocket) => {
    clients.delete(ws);
    users.delete(ws);
    sendToAll(JSON.stringify({ Type: "ALL_USERS", Payload: Array.from(users.values()).map(u => u.name) }));
};

export const handleMessage = (message: Message, ws: WebSocket) => {
    switch (message.Type) {
        case "SEND_MESSAGE":
            console.log("SEND_MESSAGE", message.Payload);
            sendToOne(ws, JSON.stringify({ Type: "SEND_MESSAGE", Payload: message.Payload }));
            break;
        case "SET_USERNAME":
            console.log("SET_USERNAME", message.Payload);
            users.set(ws, { id: Math.random().toString(), name: message.Payload });
            sendToAll(JSON.stringify({ Type: "ALL_USERS", Payload: Array.from(users.values()).map(u => u.name) }));
            break;
    }
}
const sendToOne = (ws: WebSocket, message: string) => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
    }
}

function sendToAll(message: string) {
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}