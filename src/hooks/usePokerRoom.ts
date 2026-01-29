import { useEffect, useReducer, useRef } from "react";
import type {
	ClientMessage,
	ClientMessageType,
	ServerMessage,
	User,
} from "../types";

export interface RoomState {
	users: User[];
	isRevealed: boolean;
}

interface State {
	userId: string;
	userName: string;
	vote: string | null;
	room: RoomState;
	isJoined: boolean;
}

type Action =
	| { type: "SET_USER_NAME"; payload: string }
	| { type: "JOIN_SUCCESS" }
	| { type: "DISCONNECT" }
	| { type: "SET_VOTE"; payload: string | null }
	| { type: "UPDATE_ROOM"; payload: RoomState }
	| { type: "REVEAL_VOTES"; payload: { users: User[] } }
	| { type: "RESET_ROOM" };

const initialState: State = {
	userId: Math.random().toString(36).substring(7),
	userName: "",
	vote: null,
	room: {
		users: [],
		isRevealed: false,
	},
	isJoined: false,
};

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "SET_USER_NAME":
			return { ...state, userName: action.payload };
		case "JOIN_SUCCESS":
			return { ...state, isJoined: true };
		case "DISCONNECT":
			return { ...state, isJoined: false };
		case "SET_VOTE":
			return { ...state, vote: action.payload };
		case "UPDATE_ROOM":
			return { ...state, room: action.payload };
		case "REVEAL_VOTES":
			return {
				...state,
				room: {
					users: action.payload.users,
					isRevealed: true,
				},
			};
		case "RESET_ROOM":
			return {
				...state,
				room: {
					...state.room,
					isRevealed: false,
					users: state.room.users.map((u) => ({
						...u,
						voted: false,
						vote: null,
					})),
				},
				vote: null,
			};
		default:
			return state;
	}
}

export const usePokerRoom = () => {
	const websocketRef = useRef<WebSocket | null>(null);
	const [state, dispatch] = useReducer(reducer, initialState);

	const sendMessage = (type: ClientMessageType, payload: any) => {
		if (websocketRef.current?.readyState === WebSocket.OPEN) {
			const message: ClientMessage = {
				type,
				payload,
				userId: state.userId,
				timestamp: Date.now(),
			};
			websocketRef.current.send(JSON.stringify(message));
		}
	};

	useEffect(() => {
		const wsUri = "ws://127.0.0.1:8080";
		const ws = new WebSocket(wsUri);
		websocketRef.current = ws;

		ws.onopen = () => console.log("CONNECTED");
		ws.onclose = () => {
			console.log("DISCONNECTED");
			dispatch({ type: "DISCONNECT" });
		};
		ws.onerror = () => console.log("ERROR");

		ws.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data) as ServerMessage;
				console.log("Received:", message);

				switch (message.type) {
					case "server:room:status":
						dispatch({ type: "UPDATE_ROOM", payload: message.payload });
						// If votes cleared, clear local vote
						if (
							!message.payload.isRevealed &&
							message.payload.users.every((u: User) => !u.voted)
						) {
							dispatch({ type: "SET_VOTE", payload: null });
						}
						break;
					case "server:vote:revealed":
						dispatch({ type: "REVEAL_VOTES", payload: message.payload });
						break;
					case "server:room:reset":
						dispatch({ type: "RESET_ROOM" });
						break;
				}
			} catch (e) {
				console.error("Message parsing error:", e);
			}
		};

		return () => ws.close();
	}, []); // connection logic is independent of state, except userId which is constant

	const setUserName = (name: string) => {
		dispatch({ type: "SET_USER_NAME", payload: name });
	};

	const joinRoom = () => {
		if (!state.userName.trim()) return;
		sendMessage("client:user:join", {
			userId: state.userId,
			userName: state.userName,
		});
		dispatch({ type: "JOIN_SUCCESS" });
	};

	const castVote = (val: string) => {
		if (state.room.isRevealed) return;
		dispatch({ type: "SET_VOTE", payload: val });
		sendMessage("client:vote:cast", { userId: state.userId, value: val });
	};

	const revealVotes = () => sendMessage("client:vote:reveal", {});
	const resetRoom = () => sendMessage("client:room:reset", {});

	return {
		// State
		userId: state.userId,
		userName: state.userName,
		setUserName,
		vote: state.vote,
		room: state.room,
		isJoined: state.isJoined,

		// Actions
		joinRoom,
		castVote,
		revealVotes,
		resetRoom,
	};
};
