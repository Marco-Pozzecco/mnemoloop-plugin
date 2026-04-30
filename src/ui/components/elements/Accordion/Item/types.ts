import { Snippet } from 'svelte';

export interface AccordionItemProps {
	value: string;
	header: Snippet;
	content: Snippet;
	actions?: Snippet;
}

export default AccordionItemProps;
