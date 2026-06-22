<script lang="ts">
	import { NavigationMenu } from 'bits-ui';
	import type NavigationMenuContentProps from './types';

	let { forceMount = false, className = '', children }: NavigationMenuContentProps = $props();
</script>

<NavigationMenu.Content {forceMount} class="ml-navmenu__content {className}">
	{#if children}
		{@render children()}
	{/if}
</NavigationMenu.Content>

<style>
	:global(.ml-navmenu__content) {
		padding: var(--ml-padding-md);
		background-color: var(--ml-background-primary);
		border-radius: var(--ml-radius-md);
		box-shadow: var(--ml-shadow-md);
	}
</style>
