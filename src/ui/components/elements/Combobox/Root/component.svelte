<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { setComboboxContext, type ComboboxContextValue } from '../context';
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
		onValueChange,
		class: className = '',
		children,
		...rest
	}: ComboboxRootProps = $props();

	// The trigger is the default floating reference for this compound primitive.
	// Content may still receive an explicit customAnchor to override it.
	const context = $state<ComboboxContextValue>({ trigger: null });
	setComboboxContext(context);

	// Use the callback equivalent of bind:value for the bits primitive. This keeps
	// direct `value={...}` consumers (including Manage's callback flow) warning-free
	// while still propagating updates through this component's bindable prop.
	function handleValueChange(nextValue: string | string[]): void {
		value = nextValue as never;
		onValueChange?.(nextValue as never);
	}
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
		onValueChange={handleValueChange}
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
