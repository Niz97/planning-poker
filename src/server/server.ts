import type { RawData } from "ws";
import WebSocket, { WebSocketServer } from "ws";
import type { ClientMessage, ServerMessage, User } from "../types";

const PORT = Number(process.env.PORT) || 8080;
const wss = new WebSocketServer({ port: PORT });

// -- State Definitions --

interface Client {
	id: string;
	name: string;
	ws: WebSocket;
	roomId: string;
}

interface Room {
	id: string;
	users: Set<string>; // Set of userIds
	votes: Map<string, string>; // userId -> vote value
	isRevealed: boolean;
}

// Global State
const clients = new Map<string, Client>(); // userId -> Client
const rooms = new Map<string, Room>(); // roomId -> Room

// -- Helpers --

function getOrCreateRoom(roomId: string): Room {
	let room = rooms.get(roomId);
	if (!room) {
		room = {
			id: roomId,
			users: new Set(),
			votes: new Map(),
			isRevealed: false,
		};
		rooms.set(roomId, room);
		console.log(`Created room: ${roomId}`);
	}
	return room;
}

function getRoomForUser(userId: string): Room | undefined {
	const client = clients.get(userId);
	if (!client) return undefined;
	return rooms.get(client.roomId);
}

// -- Handlers --

wss.on("connection", (ws) => {
	console.log("Client connected");
	let currentUserId: string | null = null;

	ws.on("message", (data: RawData) => {
		try {
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
					handleReveal(message.userId);
					break;
				case "client:room:reset":
					handleResetRoom(message.userId);
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
		if (currentUserId) {
			handleDisconnect(currentUserId);
		}
	});
});

function handleJoin(ws: WebSocket, msg: ClientMessage) {
	const { userId, userName, roomId } = msg.payload as {
		userId: string;
		userName: string;
		roomId?: string;
	};

	const targetRoomId = roomId || "default";

	// Update Client state
	clients.set(userId, {
		id: userId,
		name: userName,
		ws,
		roomId: targetRoomId,
	});

	// Update Room state
	const room = getOrCreateRoom(targetRoomId);
	room.users.add(userId);

	console.log(`User ${userName} (${userId}) joined room ${targetRoomId}`);

	// Ack to user
	const userList = Array.from(room.users)
		.map((uid) => clients.get(uid)?.name)
		.filter((name): name is string => !!name);

	ws.send(
		JSON.stringify({
			type: "server:user:joined",
			payload: {
				userId,
				userName,
				roomId: targetRoomId,
				allUsers: userList,
			},
		}),
	);

	// Broadcast updated status to the room
	broadcastStatus(targetRoomId);
}

function handleVote(msg: ClientMessage) {
	const { userId, value } = msg.payload as { userId: string; value: string };
	const room = getRoomForUser(userId);

	if (room && room.users.has(userId)) {
		room.votes.set(userId, value);
		broadcastStatus(room.id);
	}
}

function handleReveal(userId: string) {
	const room = getRoomForUser(userId);

	if (room) {
		room.isRevealed = true;
		broadcastReveal(room.id);
	}
}

function handleResetRoom(userId: string) {
	const room = getRoomForUser(userId);

	if (room) {
		room.votes.clear();
		room.isRevealed = false;

		const resetMsg: ServerMessage = {
			type: "server:room:reset",
			payload: { timestamp: Date.now() },
			timestamp: Date.now(),
		};
		broadcastToRoom(room.id, resetMsg);
	}
}

function handleDisconnect(userId: string) {
	const client = clients.get(userId);
	if (client) {
		console.log(`User ${userId} disconnected from room ${client.roomId}`);
		const room = rooms.get(client.roomId);
		if (room) {
			room.users.delete(userId);
			room.votes.delete(userId);

			if (room.users.size === 0) {
				console.log(`Room ${room.id} is empty, cleaning up? (Keeping for now)`);
				// Optional: rooms.delete(room.id);
			} else {
				broadcastStatus(room.id);
			}
		}
		clients.delete(userId);
	}
}

// -- Broadcast Helpers --

function broadcastToRoom(roomId: string, msg: ServerMessage) {
	const room = rooms.get(roomId);
	if (!room) return;

	const data = JSON.stringify(msg);
	for (const userId of room.users) {
		const client = clients.get(userId);
		if (client && client.ws.readyState === WebSocket.OPEN) {
			client.ws.send(data);
		}
	}
}

function broadcastStatus(roomId: string) {
	const room = rooms.get(roomId);
	if (!room) return;

	// Construct User objects for the frontend
	const usersList: User[] = Array.from(room.users).map((userId) => {
		const client = clients.get(userId);
		return {
			id: userId,
			name: client ? client.name : "Unknown",
			voted: room.votes.has(userId),
			vote: room.isRevealed ? room.votes.get(userId) || null : null,
		};
	});

	const status: ServerMessage = {
		type: "server:room:status",
		payload: {
			users: usersList,
			isRevealed: room.isRevealed,
		},
		timestamp: Date.now(),
	};
	broadcastToRoom(roomId, status);
}

function broadcastReveal(roomId: string) {
	const room = rooms.get(roomId);
	if (!room) return;

	console.log(`Broadcasting reveal to room ${roomId}`);

	const usersList: User[] = Array.from(room.users).map((userId) => {
		const client = clients.get(userId);
		return {
			id: userId,
			name: client ? client.name : "Unknown",
			vote: room.votes.get(userId) || null,
			voted: room.votes.has(userId),
		};
	});

	broadcastToRoom(roomId, {
		type: "server:vote:revealed",
		payload: {
			users: usersList,
			isRevealed: true,
		},
		timestamp: Date.now(),
	});
}

console.log(`WebSocket server running on port ${PORT}`);
