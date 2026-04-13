export default interface DangerZoneProps {
	onReset: () => Promise<void>;
	isLoading?: boolean;
}
