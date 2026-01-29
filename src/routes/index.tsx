import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const websocketRef = useRef<WebSocket | null>(null);
	const [receivedMessage, setReceivedMessage] = useState<string>("");
	const [sendMessage, setSendMessage] = useState<string>("");
	const handleSend = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		websocketRef.current?.send(sendMessage);
	};

	useEffect(() => {
		const wsUri = "ws://127.0.0.1:8080";
		if (websocketRef.current === null) {
			websocketRef.current = new WebSocket(wsUri);
		}

		if (websocketRef.current !== null) {
			websocketRef.current.addEventListener("open", () => {
				console.log("CONNECTED");
			});

			websocketRef.current.addEventListener("error", (e) => {
				console.log(`ERROR`);
			});

			websocketRef.current.addEventListener("message", (e) => {
				console.log(`MESSAGE`, e.data);
				setReceivedMessage(e.data);
			});
		}
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			<section className="relative py-20 px-6 text-center overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
				<div className="relative max-w-5xl mx-auto">
					<div className="flex items-center justify-center gap-6 mb-6">
						<img
							src="/tanstack-circle-logo.png"
							alt="TanStack Logo"
							className="w-24 h-24 md:w-32 md:h-32"
						/>
						<h1 className="text-6xl md:text-7xl font-black text-white [letter-spacing:-0.08em]">
							<span className="text-gray-300">TANSTACK</span>{" "}
							<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
								START
							</span>
						</h1>
					</div>
					<p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
						The framework for next generation AI applications
					</p>
					<p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
						Full-stack framework powered by TanStack Router for React and Solid.
						Build modern applications with server functions, streaming, and type
						safety.
					</p>
					<div className="flex flex-col items-center gap-4">
						<a
							href="https://tanstack.com/start"
							target="_blank"
							rel="noopener noreferrer"
							className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
						>
							Documentation
						</a>
						<p className="text-gray-400 text-sm mt-2">
							Begin your TanStack Start journey by editing{" "}
							<code className="px-2 py-1 bg-slate-700 rounded text-cyan-400">
								/src/routes/index.tsx
							</code>
						</p>
					</div>
				</div>
			</section>

			<h1>Hello</h1>
			<p>{receivedMessage}</p>
			<button type="button" onClick={handleSend}>
				Send Message
			</button>
			<input
				value={sendMessage}
				onChange={(e) => setSendMessage(e.target.value)}
			/>
		</div>
	);
}
