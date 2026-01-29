import type { RawData } from "ws";
import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

// Simple State
interface AppState {
	users: Map<string, { name: string; ws: WebSocket }>;
	votes: Map<string, string>; // userId -> voteValue
	isRevealed: boolean;
}

const state: AppState = {
	users: new Map(),
	votes: new Map(),
	isRevealed: false,
};

type MessageType =
	| "user:join"
	| "vote:cast"
	| "vote:reveal"
	| "vote:reset"
	| "heartbeat";

interface ClientMessage {
	type: MessageType;
	payload: any;
	userId: string;
	timestamp: number;
}

wss.on("connection", (ws) => {
	console.log("Client connected");
	let currentUserId: string | null = null;

	ws.on("message", (data: RawData) => {
		try {
			const message: ClientMessage = JSON.parse(data.toString());
			currentUserId = message.userId;

			switch (message.type) {
				case "user:join":
					handleJoin(ws, message);
					break;
				case "vote:cast":
					handleVote(message);
					break;
				case "vote:reveal":
					handleReveal();
					break;
				// case "vote:reset":
				// 	handleReset();
				// 	break;
				case "heartbeat":
					ws.send(
						JSON.stringify({ type: "heartbeat:ack", timestamp: Date.now() }),
					);
					break;
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
	state.users.set(userId, { name: userName, ws });

	// Ack to user
	ws.send(
		JSON.stringify({
			type: "user:joined",
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
	const results = Array.from(state.votes.entries()).map(([uid, val]) => ({
		userName: state.users.get(uid)?.name || "Unknown",
		value: val,
	}));

	broadcast({
		type: "vote:revealed",
		payload: { results },
	});
}

// Helpers
function broadcast(msg: unknown) {
	const data = JSON.stringify(msg);
	for (const user of state.users.values()) {
		if (user.ws.readyState === WebSocket.OPEN) {
			user.ws.send(data);
		}
	}
}

function broadcastStatus() {
	const usersList = Array.from(state.users.entries()).map(([id, u]) => ({
		userId: id,
		userName: u.name,
		voted: state.votes.has(id),
		vote: state.isRevealed ? state.votes.get(id) : null,
	}));

	const status = {
		type: "room:status",
		payload: {
			users: usersList,
			isRevealed: state.isRevealed,
		},
	};
	broadcast(status);
}

console.log("WebSocket server running on port 8080");
