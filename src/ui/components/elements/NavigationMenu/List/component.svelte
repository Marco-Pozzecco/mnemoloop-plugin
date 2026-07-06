<script lang="ts">
	import { NavigationMenu } from 'bits-ui';
	import type NavigationMenuListProps from './types';

	let { className = '', children }: NavigationMenuListProps = $props();
</script>

<NavigationMenu.List class="ml-navmenu__list {className}">
	{#if children}
		{@render children()}
	{/if}
</NavigationMenu.List>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-navmenu__list) {
		display: flex;
		background-color: $background-primary;
		border-radius: $radius-md;
		gap: $spacing-sm;
		padding: $spacing-sm;
		margin: 0;
	}
</style>
