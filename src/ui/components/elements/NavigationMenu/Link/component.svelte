<script lang="ts">
	import { NavigationMenu } from 'bits-ui';
	import type NavigationMenuLinkProps from './types';

	let { active = false, onSelect, className = '', children }: NavigationMenuLinkProps = $props();
</script>

<NavigationMenu.Link {active} {onSelect} class="ml-navmenu__link {className}">
	{#if children}
		{@render children()}
	{/if}
</NavigationMenu.Link>

<style>
	:global(.ml-navmenu__link) {
		display: block;
		padding: var(--ml-padding-sm);
		text-decoration: none;
		color: var(--text-normal);
		border-radius: var(--ml-radius-sm);
		transition: background-color var(--ml-transition-fast);
	}

	:global(.ml-navmenu__link:hover) {
		background-color: var(--ml-background-modifier-hover);
	}

	:global(.ml-navmenu__link[data-active]) {
		color: var(--ml-text-accent);
	}
</style>
