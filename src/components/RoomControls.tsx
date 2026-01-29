import { Button } from "@/components/ui/button";

interface RoomControlsProps {
	isRevealed: boolean;
	hasVotes: boolean;
	onReveal: () => void;
	onReset: () => void;
}

export const RoomControls = ({
	isRevealed,
	hasVotes,
	onReveal,
	onReset,
}: RoomControlsProps) => {
	return (
		<div className="flex gap-4 mt-8">
			<Button
				onClick={onReveal}
				disabled={isRevealed || !hasVotes}
				className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 px-8 min-w-32 shadow-lg shadow-blue-900/20"
			>
				Reveal Votes
			</Button>
			<Button
				variant="outline"
				onClick={onReset}
				className="border-neutral-800 hover:bg-neutral-900 text-neutral-300 h-12 px-8 min-w-32"
			>
				New Round
			</Button>
		</div>
	);
};
