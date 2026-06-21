<script lang="ts">
	import { Tabs } from 'bits-ui';
	import type TabsListProps from './types';

	let { className = '', children }: TabsListProps = $props();
</script>

<Tabs.List class="ml-tabs__list {className}">
	{#if children}
		{@render children()}
	{/if}
</Tabs.List>

<style>
	:global(.ml-tabs__list) {
		display: flex;
		background-color: var(--ml-background-primary);
		border-radius: var(--ml-radius-md);
		gap: var(--ml-spacing-sm);
		padding: var(--ml-padding-sm);
		flex: 0 1 100%;
	}
</style>
