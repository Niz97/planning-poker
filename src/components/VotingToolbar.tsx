import { cn } from "@/lib/utils";

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

interface VotingToolbarProps {
	vote: string | null;
	isRevealed: boolean;
	onVote: (val: string) => void;
}

export const VotingToolbar = ({
	vote,
	isRevealed,
	onVote,
}: VotingToolbarProps) => {
	return (
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
							disabled={isRevealed}
							className={cn(
								"w-12 h-16 rounded-lg border-2 flex items-center justify-center text-xl font-bold transition-all duration-200 transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
								vote === val
									? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] -translate-y-2"
									: "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-750",
							)}
							onClick={() => onVote(val)}
						>
							{val}
						</button>
					))}
				</div>
			</div>
		</div>
	);
};
