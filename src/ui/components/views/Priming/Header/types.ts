import { PrimingState } from '@/ui/store/priming.store';

export default interface Props {
	state: PrimingState;
	onExit: () => void;
}
