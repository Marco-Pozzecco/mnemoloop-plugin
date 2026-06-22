<script lang="ts">
	import { NavigationMenu } from 'bits-ui';
	import type NavigationMenuSubProps from './types';

	let {
		value = $bindable(''),
		onValueChange,
		orientation = 'horizontal',
		className = '',
		children,
	}: NavigationMenuSubProps = $props();
</script>

<NavigationMenu.Sub
	bind:value
	{onValueChange}
	{orientation}
	class="ml-navmenu__sub {className}"
>
	{#if children}
		{@render children()}
	{/if}
</NavigationMenu.Sub>
