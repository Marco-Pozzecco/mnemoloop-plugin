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
	className?: string;
	onchange?: (value: string) => void;
	onfocus?: () => void;
	onblur?: () => void;
	onkeydown?: (event: KeyboardEvent) => void;
}
