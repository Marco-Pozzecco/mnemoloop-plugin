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

<style>
	:global(.ml-navmenu__list) {
		display: flex;
		background-color: var(--ml-background-primary);
		border-radius: var(--ml-radius-md);
		gap: var(--ml-spacing-sm);
		padding: var(--ml-padding-sm);
		margin: 0;
	}
</style>
