import { createFileRoute } from "@tanstack/react-router";
import { GameHeader } from "@/components/GameHeader";
import { JoinScreen } from "@/components/JoinScreen";
import { PokerTable } from "@/components/PokerTable";
import { RoomControls } from "@/components/RoomControls";
import { VoteCard } from "@/components/VoteCard";
import { VotingToolbar } from "@/components/VotingToolbar";
import { usePokerRoom } from "@/hooks/usePokerRoom";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const {
		// State
		userId,
		userName,
		setUserName,
		vote,
		room,
		isJoined,
		// Actions
		joinRoom,
		castVote,
		revealVotes,
		resetRoom,
	} = usePokerRoom();

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
			<JoinScreen
				userName={userName}
				setUserName={setUserName}
				onJoin={joinRoom}
			/>
		);
	}

	return (
		<div className="min-h-screen bg-neutral-950 text-white overflow-hidden flex flex-col">
			<GameHeader userCount={room.users.length} userName={userName} />

			<main className="flex-1 relative flex flex-col items-center justify-center p-8">
				{/* Poker Table Area */}
				<div className="w-full max-w-5xl">
					<PokerTable>
						{room.users.map((user, index) => (
							<div
								key={user.id}
								className="absolute transition-all duration-700 ease-in-out"
								style={getPositionStyle(index, room.users.length)}
							>
								<VoteCard
									voted={user.voted}
									isRevealed={room.isRevealed}
									value={user.vote}
									userName={
										user.id === userId ? `${user.name} (You)` : user.name
									}
								/>
							</div>
						))}
					</PokerTable>
				</div>

				<RoomControls
					isRevealed={room.isRevealed}
					hasVotes={room.users.some((u) => u.voted)}
					onReveal={revealVotes}
					onReset={resetRoom}
				/>
			</main>

			<VotingToolbar
				vote={vote}
				isRevealed={room.isRevealed}
				onVote={castVote}
			/>
		</div>
	);
}
