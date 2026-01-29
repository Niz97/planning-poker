import type { RawData } from "ws";
import WebSocket, { WebSocketServer } from "ws";
import type { ClientMessage, ServerMessage, User } from "../types";

const wss = new WebSocketServer({ port: 8080 });

// Simple State
interface UserSession {
	id: string;
	name: string;
	ws: WebSocket;
}

interface AppState {
	users: Map<UserSession["id"], UserSession>;
	votes: Map<UserSession["id"], string>;
	isRevealed: boolean;
}

const emptyRoom: AppState = {
	users: new Map(),
	votes: new Map(),
	isRevealed: false,
};

const state: AppState = emptyRoom;

wss.on("connection", (ws) => {
	console.log("Client connected");
	let currentUserId: string | null = null;

	ws.on("message", (data: RawData) => {
		try {
			console.log("Server state:", state);
			const message: ClientMessage = JSON.parse(data.toString());
			currentUserId = message.userId;

			switch (message.type) {
				case "client:user:join":
					handleJoin(ws, message);
					break;
				case "client:vote:cast":
					handleVote(message);
					break;
				case "client:vote:reveal":
					handleReveal();
					break;
				case "client:room:reset":
					handleResetRoom();
					break;
				case "client:heartbeat": {
					const ack: ServerMessage = {
						type: "server:heartbeat:ack",
						payload: { timestamp: Date.now() },
						timestamp: Date.now(),
					};
					ws.send(JSON.stringify(ack));
					break;
				}
			}
		} catch (e) {
			console.error("Failed to process message", e);
		}
	});

	ws.on("close", () => {
		if (currentUserId && state.users.has(currentUserId)) {
			console.log(`User ${currentUserId} disconnected`);
			state.users.delete(currentUserId);
			state.votes.delete(currentUserId);
			broadcastStatus();
		}
	});
});

function handleJoin(ws: WebSocket, msg: ClientMessage) {
	const { userId, userName } = msg.payload as {
		userId: string;
		userName: string;
	};
	state.users.set(userId, { id: userId, name: userName, ws });

	// Ack to user
	ws.send(
		JSON.stringify({
			type: "server:user:joined",
			payload: {
				userId,
				userName,
				allUsers: Array.from(state.users.values()).map((u) => u.name),
			},
		}),
	);

	// Broadcast updated status
	broadcastStatus();
}

function handleVote(msg: ClientMessage) {
	const { userId, value } = msg.payload as { userId: string; value: string };
	if (state.users.has(userId)) {
		state.votes.set(userId, value);
		broadcastStatus();
	}
}

function handleReveal() {
	state.isRevealed = true;

	broadcastToAll();
}

function handleResetRoom() {
	state.votes.clear();
	state.isRevealed = false;

	const resetMsg: ServerMessage = {
		type: "server:room:reset",
		payload: { timestamp: Date.now() },
		timestamp: Date.now(),
	};
	broadcast(resetMsg);
}

// Helpers
function broadcast(msg: ServerMessage) {
	const data = JSON.stringify(msg);
	for (const user of state.users.values()) {
		if (user.ws.readyState === WebSocket.OPEN) {
			user.ws.send(data);
		}
	}
}

function broadcastStatus() {
	const usersList: User[] = Array.from(state.users.entries()).map(
		([id, u]) => ({
			id: id,
			name: u.name,
			voted: state.votes.has(id),
			vote: state.isRevealed ? state.votes.get(id) || null : null,
		}),
	);

	const status: ServerMessage = {
		type: "server:room:status",
		payload: {
			users: usersList,
			isRevealed: state.isRevealed,
		},
		timestamp: Date.now(),
	};
	broadcast(status);
}

function broadcastToAll() {
	console.log("Broadcasting to all");
	const allUsers = Array.from(state.users.values());
	const allWebsockets = allUsers.map((u) => u.ws);

	const users = allUsers.map((user) => ({
		id: user.id,
		name: user.name,
		vote: state.votes.get(user.id) || null,
		voted: state.votes.has(user.id), // TODO: set to always true, realistically we should never be here unless every player has voted
	}));

	// send message to all open connections
	for (const ws of allWebsockets) {
		if (ws.readyState === WebSocket.OPEN) {
			broadcast({
				type: "server:vote:revealed",
				payload: {
					users,
					isRevealed: true,
				},
				timestamp: Date.now(),
			});
		}
	}
}

console.log("WebSocket server running on port 8080");
console.log("State:", state);
