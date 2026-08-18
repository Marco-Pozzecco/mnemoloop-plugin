<script lang="ts">
	import { Combobox } from 'bits-ui';
	import type ComboboxInputProps from './types';

	let {
		ref = $bindable(null),
		defaultValue,
		clearOnDeselect = false,
		class: className = '',
		...rest
	}: ComboboxInputProps = $props();
</script>

<Combobox.Input
	bind:ref
	{defaultValue}
	{clearOnDeselect}
	{...rest}
	class="ml-combobox__input {className}"
/>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-combobox__input) {
		width: 100%;
		padding: $spacing-xs $spacing-sm;
		font-family: inherit;
		font-size: $font-sm;
		color: $text-normal;
		background-color: $background-primary;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-input;
		min-height: 32px;
		transition:
			border-color $transition-fast,
			box-shadow $transition-fast;
	}

	:global(.ml-combobox__input:focus) {
		outline: none;
		border-color: $interactive-accent;
		box-shadow: 0 0 0 2px $background-modifier-border-focus;
	}

	:global(.ml-combobox__input::placeholder) {
		color: $text-muted;
	}

	@media (max-width: 480px) {
		:global(.ml-combobox__input) {
			padding: $spacing-xs $spacing-sm;
			font-size: 1rem; /* Prevent iOS zoom */
		}
	}
</style>
