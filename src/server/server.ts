import {  WebSocketServer } from "ws";
import { handleMessage, handleConnection, handleDisconnect } from "./poker.ts";
import { WebSocket } from "ws";
import type { Message } from "../types.ts";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws: WebSocket) {
	handleConnection(ws);
	console.log("Client connected");
	ws.on("error", console.error);

	ws.onmessage = (event) => {
		console.log("received: %s", event.data);
		const message = JSON.parse(event.data.toString()) as Message;

		handleMessage(message, ws);
	};

	ws.on("close", () => {
		handleDisconnect(ws);
		console.log("Client disconnected");
	});
});


