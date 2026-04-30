<script lang="ts">
	import { Accordion } from 'bits-ui';
	import type AccordionRootProps from './types';

	let { children, ...rest }: AccordionRootProps = $props();
</script>

<Accordion.Root class="ka-accordion" {...rest}>
	{@render children?.()}
</Accordion.Root>

<style>
	/* Root accordion styles */
	:global(.ka-accordion) {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
</style>
