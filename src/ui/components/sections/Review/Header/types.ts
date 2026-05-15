export default interface HeaderProps {
	position: number;
	total: number;
	onEndSession: () => void;
	onUndo: () => void;
	canUndo: boolean;
	// Session statistics
	progress: number;
	accuracy: number;
	startTime: number;
}
