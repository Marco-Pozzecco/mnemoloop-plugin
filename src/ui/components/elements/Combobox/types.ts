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
	searchPlaceholder?: string;
	disabled?: boolean;
	required?: boolean;
	hasError?: boolean;
	errorMessage?: string;
	helperText?: string;
	className?: string;
	onchange?: (value: string) => void;
	/** Override the trigger-display label for the selected value without changing the value itself. */
	displayAs?: (value: string) => string;
}

export default ComboboxProps;
