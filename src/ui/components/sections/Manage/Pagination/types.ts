export default interface ManagePaginationProps {
	currentPage: number;
	totalPages: number;
	/** Number of filtered items used to calculate the result range. */
	totalItems?: number;
	/** Number of items displayed on each page. */
	pageSize?: number;
	/** Receives a clamped page number from every pagination control. */
	onPageChange?: (page: number) => void;
	/** Legacy directional callbacks kept for callers that have not migrated yet. */
	onPrevious?: () => void;
	onNext?: () => void;
	className?: string;
}
