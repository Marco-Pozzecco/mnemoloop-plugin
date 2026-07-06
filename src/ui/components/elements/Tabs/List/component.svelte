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

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-tabs__list) {
		display: flex;
		background-color: $background-primary;
		border-radius: $radius-md;
		gap: $spacing-sm;
		padding: $spacing-sm;
		flex: 0 1 100%;
	}
</style>
