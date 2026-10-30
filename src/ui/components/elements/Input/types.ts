export default interface InputProps {
	id?: string;
	type?: 'text' | 'number' | 'email' | 'password' | 'search';
	label?: string;
	placeholder?: string;
	value?: string | number;
	disabled?: boolean;
	required?: boolean;
	hasError?: boolean;
	errorMessage?: string;
	helperText?: string;
	maxLength?: number;
	min?: number;
	max?: number;
	step?: number;
	class?: string;
	/** Fires on every keystroke, for live filtering. */
	oninput?: (value: string) => void;
	onchange?: (value: string) => void;
	onfocus?: () => void;
	onblur?: () => void;
	onkeydown?: (event: KeyboardEvent) => void;
}
