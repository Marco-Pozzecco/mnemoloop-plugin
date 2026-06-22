<script lang="ts">
	import { NavigationMenu } from 'bits-ui';
	import type NavigationMenuRootProps from './types';

	let {
		value = $bindable(''),
		onValueChange,
		delayDuration = 200,
		skipDelayDuration = 300,
		dir = 'ltr',
		orientation = 'horizontal',
		className = '',
		children,
	}: NavigationMenuRootProps = $props();
</script>

<NavigationMenu.Root
	bind:value
	{onValueChange}
	{delayDuration}
	{skipDelayDuration}
	{dir}
	{orientation}
	class="ml-navmenu {className}"
>
	{#if children}
		{@render children()}
	{/if}
</NavigationMenu.Root>

<style>
	/*:global(.ml-navmenu) {
		width: 100%;
		position: fixed;
		top: 0;
		left: 0;
	}*/
</style>
