export default interface HeaderProps {
	position: number;
	total: number;
	onEndSession: () => void;
	// Session statistics
	remaining: number;
	progress: number;
	accuracy: number;
	startTime: number;
}
