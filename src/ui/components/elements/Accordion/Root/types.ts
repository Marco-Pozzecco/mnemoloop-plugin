import { Snippet } from 'svelte';

// export interface AccordionRootProps {
// 	type: 'single' | 'multiple';
// 	children?: Snippet;
// 	value?: string | string[];
// }

export type AccordionRootProps =
	| { type: 'single'; children?: Snippet; value?: string }
	| { type: 'multiple'; children?: Snippet; value?: string[] };

export default AccordionRootProps;
