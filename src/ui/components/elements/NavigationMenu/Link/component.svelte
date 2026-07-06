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

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-navmenu__link) {
		display: block;
		padding: $spacing-sm;
		text-decoration: none;
		color: $text-normal;
		border-radius: $radius-sm;
		transition: background-color $transition-fast;
	}

	:global(.ml-navmenu__link:hover) {
		background-color: $background-modifier-hover;
	}

	:global(.ml-navmenu__link[data-active]) {
		color: $text-accent;
	}
</style>
