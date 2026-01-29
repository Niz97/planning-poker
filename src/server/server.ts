import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws) {
	console.log("Client connected");
	console.log(ws);
	ws.on("error", console.error);

	ws.on("message", function message(data) {
		console.log("received: %s", data);
	});

	ws.send("something");

	ws.on("close", () => {
		console.log("Client disconnected");
	});
});
