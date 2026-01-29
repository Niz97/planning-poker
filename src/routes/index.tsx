import { Message } from "@/types";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const websocketRef = useRef<WebSocket | null>(null);

	const [username, setUsername] = useState<string>("");
	const [usernameInput, setUsernameInput] = useState<string>("");
	const [allUsers, setAllUsers] = useState<string[]>([]);

	const [receivedMessage, setReceivedMessage] = useState<string>("");
	const [sendMessage, setSendMessage] = useState<string>("");

	console.log("re", receivedMessage)

	const handleMessage = (message: Message) => {
		switch (message.Type) {
			case "ALL_USERS":
				setAllUsers(message.Payload);
				break;
			case "SEND_MESSAGE":
				setReceivedMessage(message.Payload);
				break;
		}
	}

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
				handleMessage(JSON.parse(e.data));
			});

			websocketRef.current.addEventListener("close", () => {
				console.log("DISCONNECTED");
			});
		}

		return () => {
			websocketRef.current?.close();
		};
	}, []);

	const send = (data: Message) => {
		websocketRef.current?.send(JSON.stringify(data));
	}

	const handleSend = (event: React.MouseEvent<HTMLButtonElement>) => {

		event.preventDefault();
		send({
			Type: "SEND_MESSAGE",
			Payload: sendMessage,
		});
	};

	const handleSetUsername = (event: React.MouseEvent<HTMLButtonElement>) => {

		event.preventDefault();
		setUsername(usernameInput);
		setUsernameInput("");
		send({
			Type: "SET_USERNAME",
			Payload: usernameInput,
		});
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-pink-500 via-purple-500 to-blue-500">
			<h1>Hello {username}</h1>
			<p>{receivedMessage}</p>

			<button type="button" onClick={handleSetUsername}>
				Set Username
			</button>
			<input
				value={usernameInput}
				onChange={(e) => setUsernameInput(e.target.value)}
			/>

			<button type="button" onClick={handleSend}>
				Send Message
			</button>
			<input
				value={sendMessage}
				onChange={(e) => setSendMessage(e.target.value)}
			/>

			<button type="button" onClick={() => alert(allUsers.join(", "))}>
				Show all users in alert!
			</button>
		</div>
	);
}
