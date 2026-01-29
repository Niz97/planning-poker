import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PokerTable } from "@/components/PokerTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VoteCard } from "@/components/VoteCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: App });

interface User {
	userId: string;
	userName: string;
	voted: boolean;
	vote: string | null;
}

interface RoomStatus {
	users: User[];
	isRevealed: boolean;
}

interface AppMessage {
	type: string;
	payload: any;
	userId?: string;
	timestamp?: number;
}

const CARDS = [
	"0",
	"1",
	"2",
	"3",
	"5",
	"8",
	"13",
	"20",
	"40",
	"100",
	"?",
	"☕",
];

function App() {
	const websocketRef = useRef<WebSocket | null>(null);
	const [userName, setUserName] = useState<string>("");
	const [userId] = useState(() => Math.random().toString(36).substring(7));
	const [vote, setVote] = useState<string | null>(null);
	const [roomStatus, setRoomStatus] = useState<RoomStatus>({
		users: [],
		isRevealed: false,
	});
	const [isJoined, setIsJoined] = useState(false);

	const sendMessage = (type: string, payload: any) => {
		if (websocketRef.current?.readyState === WebSocket.OPEN) {
			const message: AppMessage = {
				type,
				payload,
				userId,
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
			setIsJoined(false);
		};
		ws.onerror = () => console.log("ERROR");

		ws.onmessage = (event) => {
			try {
				const message: AppMessage = JSON.parse(event.data);
				console.log("Received:", message);

				switch (message.type) {
					case "room:status":
						setRoomStatus(message.payload);
						// If votes cleared, clear local vote
						if (
							!message.payload.isRevealed &&
							message.payload.users.every((u: User) => !u.voted)
						) {
							setVote(null);
						}
						break;
				}
			} catch (e) {
				console.error("Message parsing error:", e);
			}
		};

		return () => ws.close();
	}, []);

	const handleJoin = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!userName.trim()) return;
		sendMessage("user:join", { userId, userName });
		setIsJoined(true);
	};

	const handleVote = (val: string) => {
		if (roomStatus.isRevealed) return;
		setVote(val);
		sendMessage("vote:cast", { userId, value: val });
	};

	const handleReveal = () => sendMessage("vote:reveal", {});
	const handleReset = () => sendMessage("vote:reset", {});

	// Calculate user positions around the table
	const getPositionStyle = (index: number, total: number) => {
		const angle = (index / total) * 2 * Math.PI;
		const rx = 40; // horizontal radius %
		const ry = 40; // vertical radius %
		const x = 50 + rx * Math.cos(angle);
		const y = 50 + ry * Math.sin(angle);
		return {
			left: `${x}%`,
			top: `${y}%`,
			transform: "translate(-50%, -50%)",
		};
	};

	if (!isJoined) {
		return (
			<div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
				<Card className="w-full max-w-md bg-neutral-900 border-neutral-800 text-white">
					<CardContent className="pt-6 flex flex-col gap-6">
						<div className="space-y-2 text-center">
							<h1 className="text-3xl font-bold tracking-tight">
								Join Planning Poker
							</h1>
							<p className="text-neutral-400 text-sm">
								Enter your name to join the session
							</p>
						</div>
						<form onSubmit={handleJoin} className="flex flex-col gap-4">
							<Input
								className="bg-neutral-800 border-neutral-700 h-12 text-lg"
								placeholder="What's your name?"
								autoFocus
								value={userName}
								onChange={(e) => setUserName(e.target.value)}
							/>
							<Button
								size="lg"
								className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-500 transition-colors"
							>
								Join Session
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-neutral-950 text-white overflow-hidden flex flex-col">
			{/* Header */}
			<header className="p-6 border-b border-neutral-900 flex justify-between items-center bg-neutral-950/50 backdrop-blur-md sticky top-0 z-50">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xs rotate-12">
						PP
					</div>
					<h1 className="text-xl font-bold tracking-tight">Planning Poker</h1>
				</div>
				<div className="flex items-center gap-4">
					<Badge
						variant="outline"
						className="text-neutral-400 border-neutral-800 px-3 py-1"
					>
						{roomStatus.users.length}{" "}
						{roomStatus.users.length === 1 ? "User" : "Users"} Online
					</Badge>
					<div className="h-4 w-px bg-neutral-800" />
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
						<span className="text-sm font-medium text-neutral-400">
							{userName}
						</span>
					</div>
				</div>
			</header>

			<main className="flex-1 relative flex flex-col items-center justify-center p-8">
				{/* Poker Table Area */}
				<div className="w-full max-w-5xl">
					<PokerTable>
						{roomStatus.users.map((user, index) => (
							<div
								key={user.userId}
								className="absolute transition-all duration-700 ease-in-out"
								style={getPositionStyle(index, roomStatus.users.length)}
							>
								<VoteCard
									voted={user.voted}
									isRevealed={roomStatus.isRevealed}
									value={user.vote}
									userName={
										user.userId === userId
											? `${user.userName} (You)`
											: user.userName
									}
								/>
							</div>
						))}
					</PokerTable>
				</div>

				{/* Controls */}
				<div className="flex gap-4 mt-8">
					<Button
						onClick={handleReveal}
						disabled={
							roomStatus.isRevealed || !roomStatus.users.some((u) => u.voted)
						}
						className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 px-8 min-w-32 shadow-lg shadow-blue-900/20"
					>
						Reveal Votes
					</Button>
					<Button
						variant="outline"
						onClick={handleReset}
						className="border-neutral-800 hover:bg-neutral-900 text-neutral-300 h-12 px-8 min-w-32"
					>
						New Round
					</Button>
				</div>
			</main>

			{/* User Voting Toolbar */}
			<div className="bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-800 p-8 sticky bottom-0 z-50">
				<div className="max-w-4xl mx-auto flex flex-col gap-4">
					<div className="flex items-center justify-between text-neutral-400 text-sm font-medium mb-1">
						<span>Select your vote</span>
						{vote && (
							<span>
								Your vote: <span className="text-white font-bold">{vote}</span>
							</span>
						)}
					</div>
					<div className="flex flex-wrap justify-center gap-3">
						{CARDS.map((val) => (
							<button
								key={val}
								type="button"
								disabled={roomStatus.isRevealed}
								className={cn(
									"w-12 h-16 rounded-lg border-2 flex items-center justify-center text-xl font-bold transition-all duration-200 transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
									vote === val
										? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] -translate-y-2"
										: "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-750",
								)}
								onClick={() => handleVote(val)}
							>
								{val}
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
