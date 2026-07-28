export interface SelectOption {
	value: string;
	label: string;
	disabled?: boolean;
}

export interface SelectProps {
	id?: string;
	label?: string;
	options: SelectOption[];
	value?: string;
	placeholder?: string;
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

export default SelectProps;
