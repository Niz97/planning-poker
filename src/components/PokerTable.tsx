import type { ReactNode } from "react";

interface PokerTableProps {
	children: ReactNode;
}

export function PokerTable({ children }: PokerTableProps) {
	return (
		<div className="relative w-full max-w-4xl aspect-[2/1] mx-auto mt-12 mb-24">
			{/* The Table */}
			<div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[60%] bg-neutral-800 rounded-[100px] border-8 border-neutral-700 shadow-[inset_0_0_50px_rgba(0,0,0,0.5),0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden">
				{/* Table Felt Pattern */}
				<div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,#ffffff_1px,transparent_1px)] bg-[length:20px_20px]" />

				{/* Table Center Logo/Text */}
				<div className="flex flex-col items-center gap-1 opacity-20 select-none">
					<div className="text-4xl font-black tracking-tighter italic">
						POKER
					</div>
					<div className="text-[10px] font-bold tracking-[0.4em] uppercase">
						Planning Room
					</div>
				</div>
			</div>

			{/* The People/Chairs */}
			<div className="absolute inset-0">{children}</div>
		</div>
	);
}
