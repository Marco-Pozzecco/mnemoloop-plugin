import { PrimingState } from '@/ui/store/priming.store';

export default interface PrimingOutlineProps {
	primingState: PrimingState;
	onSelect: (index: number) => void;
}
