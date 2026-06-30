<script lang="ts">
	import { NavigationMenu } from 'bits-ui';
	import type NavigationMenuIndicatorProps from './types';

	let { forceMount = false, className = '', children }: NavigationMenuIndicatorProps = $props();
</script>

<NavigationMenu.Indicator {forceMount} class="ml-navmenu__indicator {className}">
	{#if children}
		{@render children()}
	{/if}
</NavigationMenu.Indicator>

<style>
	:global(.ml-navmenu__indicator) {
		background-color: var(--ml-interactive-accent);
		height: 2px;
		transition:
			transform var(--ml-transition-fast),
			width var(--ml-transition-fast);
	}
</style>
