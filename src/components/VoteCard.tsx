import { cn } from "@/lib/utils";

interface VoteCardProps {
	value?: string | null;
	isRevealed: boolean;
	voted: boolean;
	userName: string;
}

export function VoteCard({
	value,
	isRevealed,
	voted,
	userName,
}: VoteCardProps) {
	if (!voted) {
		return (
			<div className="flex flex-col items-center gap-2">
				<div className="w-12 h-16 rounded-md border-2 border-dashed border-neutral-700 flex items-center justify-center bg-neutral-800/50">
					<span className="text-neutral-600 text-xs">?</span>
				</div>
				<span className="text-xs text-neutral-400 font-medium">{userName}</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center gap-2">
			<div
				className={cn(
					"w-12 h-16 rounded-md border-2 flex items-center justify-center text-xl font-bold transition-all duration-500 transform perspective-1000",
					isRevealed
						? "bg-white text-black border-white rotate-y-0 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
						: "bg-blue-600 border-blue-500 rotate-y-180",
				)}
			>
				{isRevealed ? (
					<span className="animate-in fade-in zoom-in duration-300">
						{value}
					</span>
				) : (
					<div className="w-full h-full bg-[repeating-linear-gradient(45deg,#2563eb,#2563eb_4px,#1d4ed8_4px,#1d4ed8_8px)] rounded-sm" />
				)}
			</div>
			<span className="text-xs text-neutral-200 font-medium">{userName}</span>
		</div>
	);
}
