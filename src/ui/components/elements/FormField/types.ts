import type { Snippet } from 'svelte';

export default interface FormFieldProps {
	/** Group label text; rendered as a <span> (not <label>) since the field contains multiple inputs. */
	label?: string;
	className?: string;
	children?: Snippet;
}
