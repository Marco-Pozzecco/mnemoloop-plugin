export interface SelectOption {
	value: string;
	label: string;
	disabled?: boolean;
}

export default interface SelectProps {
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
}
