<script lang="ts">
	import { Combobox } from 'bits-ui';
	import type ComboboxRootProps from './types';

	let {
		type = 'single',
		value = $bindable(),
		open = $bindable(false),
		inputValue = '',
		items,
		disabled = false,
		required = false,
		name,
		loop = false,
		scrollAlignment = 'nearest',
		class: className = '',
		children,
		...rest
	}: ComboboxRootProps = $props();
</script>

<div class="ml-combobox {className}">
	<Combobox.Root
		type={type as never}
		{items}
		{disabled}
		{required}
		{name}
		{loop}
		{scrollAlignment}
		bind:open
		value={value as never}
		{inputValue}
		{...rest}
	>
		{@render children?.()}
	</Combobox.Root>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-combobox {
		position: relative;
		min-width: 0;
	}
</style>
