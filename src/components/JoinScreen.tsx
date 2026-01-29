import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface JoinScreenProps {
	userName: string;
	setUserName: (name: string) => void;
	onJoin: () => void;
}

export const JoinScreen = ({
	userName,
	setUserName,
	onJoin,
}: JoinScreenProps) => {
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onJoin();
	};

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
					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
};
