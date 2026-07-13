export default interface AutoReviewControlsProps {
	isCorrect: boolean;
	disabled?: boolean;
	onContinue: () => void;
}
