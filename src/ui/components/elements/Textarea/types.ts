export default interface TextareaProps {
	id?: string;
	label?: string;
	placeholder?: string;
	value?: string;
	disabled?: boolean;
	required?: boolean;
	hasError?: boolean;
	errorMessage?: string;
	helperText?: string;
	rows?: number;
	maxLength?: number;
	className?: string;
	onchange?: (value: string) => void;
	onfocus?: () => void;
	onblur?: () => void;
}
