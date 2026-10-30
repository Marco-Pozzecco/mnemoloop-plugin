import type { Snippet } from 'svelte';

export default interface FormFieldProps {
	/** Label text. */
	label?: string;
	/** Id of the control the label points at. Makes the label a real <label>. */
	htmlFor?: string;
	/** Guidance under the control. */
	helper?: string;
	/** Error text; replaces the helper when present. */
	error?: string;
	required?: boolean;
	className?: string;
	children?: Snippet;
}
