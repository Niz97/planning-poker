import { Badge } from "@/components/ui/badge";

interface GameHeaderProps {
	userCount: number;
	userName: string;
}

export const GameHeader = ({ userCount, userName }: GameHeaderProps) => {
	return (
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
					{userCount} {userCount === 1 ? "User" : "Users"} Online
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
	);
};
