import type { FlashcardFormMode } from '../types';

export default interface FlashcardFormActionsProps {
	mode: FlashcardFormMode;
	isSubmitting: boolean;
	/** True once the content editor has registered its validate/build functions. */
	canSubmit: boolean;
	onCancel: () => void;
	onSubmit: () => void;
	/** Only shown when provided; the surface owns the confirmation dialog. */
	onDelete?: () => void;
}
