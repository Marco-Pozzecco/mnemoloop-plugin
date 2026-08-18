import type { ManageFilters } from '@/ui/store/manage.store';

export default interface ManageFilterBarProps {
	filters: ManageFilters;
	deckOptions: string[];
	onChange: (patch: Partial<ManageFilters>) => void;
	onReset: () => void;
	className?: string;
}
