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

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-navmenu__indicator) {
		background-color: $interactive-accent;
		height: 2px;
		transition:
			transform $transition-fast,
			width $transition-fast;
	}
</style>
