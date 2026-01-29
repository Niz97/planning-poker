export type ClientMessageType =
	| "client:user:join"
	| "client:vote:cast"
	| "client:vote:reveal"
	| "client:vote:reset"
	| "client:room:reset"
	| "client:heartbeat";

export type ServerMessageType =
	| "server:room:status"
	| "server:user:joined"
	| "server:vote:revealed"
	| "server:heartbeat:ack"
	| "server:room:reset";

export interface ClientMessage {
	type: ClientMessageType;
	payload: any;
	userId: string;
	timestamp: number;
}

export type ServerMessage =
	| {
			type: "server:room:status";
			payload: { users: User[]; isRevealed: boolean };
			timestamp: number;
	  }
	| {
			type: "server:user:joined";
			payload: {
				userId: string;
				userName: string;
				allUsers: string[];
				roomId?: string;
			};
			timestamp: number;
	  }
	| {
			type: "server:vote:revealed";
			payload: { users: User[]; isRevealed: boolean };
			timestamp: number;
	  }
	| {
			type: "server:heartbeat:ack";
			payload: { timestamp: number };
			timestamp: number;
	  }
	| {
			type: "server:room:reset";
			payload: { timestamp: number };
			timestamp: number;
	  };

export interface User {
	id: string;
	name: string;
	vote: string | null;
	voted: boolean;
}

// ServerMessage is now a discriminated union for better type safety.
