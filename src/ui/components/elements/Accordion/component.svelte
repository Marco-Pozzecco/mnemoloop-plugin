<script lang="ts">
	import { AccordionItem, AccordionRoot } from '@/ui/components/elements';
	import type AccordionProps from './types.ts';

	let { items, type }: AccordionProps = $props();
</script>

<AccordionRoot {type}>
	{#each items as item (item.value)}
		<AccordionItem value={item.value}>
			{#snippet header()}
				<p class="ka-accordion-header-text">{item.title}</p>
			{/snippet}

			{#snippet content()}
				<p class="ka-accordion-content-text">{item.content}</p>
			{/snippet}
		</AccordionItem>
	{/each}
</AccordionRoot>

<style>
	.ka-accordion-header-text {
		font-size: var(--font-ui-medium);
		font-weight: var(--font-medium);
		color: var(--text-normal);
		line-height: 1.4;
		margin: 0;
	}

	.ka-accordion-content-text {
		font-size: var(--font-ui-small);
		color: var(--text-muted);
		line-height: 1.5;
		margin: 0;
		padding: var(--size-4-1) 0;
	}
</style>
