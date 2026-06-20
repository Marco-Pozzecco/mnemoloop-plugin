<script lang="ts">
	import { Tabs } from 'bits-ui';
	import type TabsRootProps from './types';

	let {
		value = $bindable(''),
		onValueChange,
		orientation = 'horizontal',
		loop = false,
		activationMode = 'automatic',
		disabled = false,
		className = '',
		children,
	}: TabsRootProps = $props();
</script>

<Tabs.Root
	bind:value
	{onValueChange}
	{orientation}
	{loop}
	{activationMode}
	{disabled}
	class="ml-tabs {className}"
>
	{#if children}
		{@render children()}
	{/if}
</Tabs.Root>
