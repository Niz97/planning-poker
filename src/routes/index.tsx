import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({ component: App });

// Simple Types (conceptually shared)
interface AppMessage {
	type: string;
	payload: unknown;
	userId?: string;
	timestamp?: number;
}

function App() {
	const websocketRef = useRef<WebSocket | null>(null);
	const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
	const [userName, setUserName] = useState<string>("");
	const [userId] = useState(() => Math.random().toString(36).substring(7));
	const [vote, setVote] = useState<string>("");

	const sendMessage = (type: string, payload: unknown) => {
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
		ws.onclose = () => console.log("DISCONNECTED");
		ws.onerror = () => console.log("ERROR");

		ws.onmessage = (event) => {
			try {
				const message: AppMessage = JSON.parse(event.data);
				console.log("Received:", message);

				switch (message.type) {
					case "user:joined":
						setReceivedMessages((prev) => [
							...prev,
							`System: ${(message.payload as { userName: string }).userName} joined`,
						]);
						break;
					case "vote:revealed":
						setReceivedMessages((prev) => [
							...prev,
							`Results: ${JSON.stringify((message.payload as { results: unknown }).results)}`,
						]);
						break;
					case "heartbeat:ack":
						console.log("Heartbeat acknowledged");
						break;
				}
			} catch (e) {
				console.error("Message parsing error:", e);
			}
		};

		return () => ws.close();
	}, []);

	const handleJoin = () => sendMessage("user:join", { userId, userName });
	const handleVote = (val: string) => {
		setVote(val);
		sendMessage("vote:cast", { userId, value: val });
	};
	const handleReveal = () => sendMessage("vote:reveal", {});

	return (
		<div className="min-h-screen bg-neutral-900 text-white p-8 flex flex-col gap-4">
			<h1 className="text-3xl font-bold">Planning Poker</h1>

			<div className="flex gap-2">
				<input
					className="bg-neutral-800 border border-neutral-700 px-3 py-2 rounded"
					placeholder="Enter Name"
					value={userName}
					onChange={(e) => setUserName(e.target.value)}
				/>
				<button
					type="button"
					className="bg-blue-600 px-4 py-2 rounded font-medium"
					onClick={handleJoin}
				>
					Join
				</button>
			</div>

			<div className="flex gap-2 mt-4">
				{["1", "2", "3", "5", "8", "13"].map((val) => (
					<button
						key={val}
						type="button"
						className={`w-12 h-16 rounded border flex items-center justify-center text-xl font-bold ${vote === val ? "bg-white text-black border-white" : "border-neutral-700 hover:border-blue-500"}`}
						onClick={() => handleVote(val)}
					>
						{val}
					</button>
				))}
			</div>

			<button
				type="button"
				className="bg-red-600 px-4 py-2 rounded font-medium mt-4 w-fit"
				onClick={handleReveal}
			>
				Reveal Votes
			</button>

			<div className="mt-8 border-t border-neutral-800 pt-4">
				<h2 className="text-xl font-semibold mb-2">Activity</h2>
				{receivedMessages.map((msg, i) => (
					<p key={`${msg}-${i}`} className="text-neutral-400 text-sm">
						{msg}
					</p>
				))}
			</div>
		</div>
	);
}
