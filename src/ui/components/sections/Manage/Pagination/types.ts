export default interface ManagePaginationProps {
	currentPage: number;
	totalPages: number;
	onPrevious: () => void;
	onNext: () => void;
	className?: string;
}
