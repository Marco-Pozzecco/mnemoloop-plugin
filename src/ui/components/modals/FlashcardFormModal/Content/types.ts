import type { FlashcardContent } from '@/schemas';

/** Returns null on success, error string on failure. */
export type ValidateFn = () => string | null;

/** Returns the type-specific content payload for submission. */
export type BuildContentFn = () => FlashcardContent;

export default interface ContentTypeProps {
	/** 'create' = fresh form; 'edit' = pre-populate from `initialContent`. */
	mode: 'create' | 'edit';
	/**
	 * The card's content object, cast to the correct type by the parent.
	 * undefined in create mode.
	 */
	initialContent?: unknown;
	/**
	 * Called on mount: the child registers its validate + buildContent fns
	 * so the parent's submit handler can invoke them on confirm.
	 */
	onRegister: (api: { validate: ValidateFn; buildContent: BuildContentFn }) => void;
}
