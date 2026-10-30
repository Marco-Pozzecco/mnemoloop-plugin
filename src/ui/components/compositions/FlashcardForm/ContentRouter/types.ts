import type { Flashcard } from '@/schemas';
import type { BuildContentFn, ValidateFn } from '../Content/types';

export default interface ContentRouterProps {
	/** The card type whose editor should render. */
	selectedType: string;
	/** 'create' = fresh form; 'edit' = pre-populate from the card. */
	mode: 'create' | 'edit';
	/** The full card in edit mode. */
	card?: Flashcard;
	/** Disable the editor while a write is in flight. */
	disabled?: boolean;
	/** The active editor registers its validate + buildContent fns here. */
	onRegister: (api: { validate: ValidateFn; buildContent: BuildContentFn }) => void;
}
