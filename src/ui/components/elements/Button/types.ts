import type { Snippet } from 'svelte';

export default interface ButtonProps {
	variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'icon';
	size?: 'small' | 'medium' | 'large';
	disabled?: boolean;
	ariaLabel?: string;
	type?: 'button' | 'submit' | 'reset';
	class?: string;
	onclick?: (event: MouseEvent) => void;
	icon?: Snippet;
	children?: Snippet;
}
