export interface ComboboxOption {
	value: string;
	label: string;
	disabled?: boolean;
}

export interface ComboboxProps {
	id?: string;
	label?: string;
	options: ComboboxOption[];
	value?: string;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	hasError?: boolean;
	errorMessage?: string;
	helperText?: string;
	className?: string;
	onchange?: (value: string) => void;
}

export default ComboboxProps;
