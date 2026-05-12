export default interface HeaderProps {
	position: number;
	total: number;
	onEndSession: () => void;
	onUndo: () => void;
	canUndo: boolean;
	// Session statistics
	remaining: number;
	progress: number;
	accuracy: number;
	startTime: number;
}
