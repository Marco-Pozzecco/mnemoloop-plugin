<script lang="ts">
	import { NavigationMenu } from 'bits-ui';
	import type NavigationMenuItemProps from './types';

	let {
		value = undefined,
		openOnHover = true,
		className = '',
		children,
	}: NavigationMenuItemProps = $props();
</script>

<NavigationMenu.Item {value} {openOnHover} class="ml-navmenu__item {className}">
	{#if children}
		{@render children()}
	{/if}
</NavigationMenu.Item>

<style>
	:global(.ml-navmenu__item) {
		display: block;
	}
</style>
