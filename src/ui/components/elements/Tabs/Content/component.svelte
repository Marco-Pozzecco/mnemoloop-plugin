<script lang="ts">
	import { Tabs } from 'bits-ui';
	import type TabsContentProps from './types';

	let { value, className = '', children }: TabsContentProps = $props();
</script>

<Tabs.Content {value} class="ml-tabs__content {className}">
	{#if children}
		{@render children()}
	{/if}
</Tabs.Content>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-tabs__content) {
		padding-top: $spacing-md;
	}
</style>
