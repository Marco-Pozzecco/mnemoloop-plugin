<script lang="ts">
	import { NavigationMenu } from 'bits-ui';
	import type NavigationMenuViewportProps from './types';

	let { forceMount = false, className = '', children }: NavigationMenuViewportProps = $props();
</script>

<NavigationMenu.Viewport {forceMount} class="ml-navmenu__viewport {className}">
	{#if children}
		{@render children()}
	{/if}
</NavigationMenu.Viewport>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-navmenu__viewport) {
		position: relative;
		overflow: hidden;
		transition:
			width $transition-fast,
			height $transition-fast;
	}
</style>
