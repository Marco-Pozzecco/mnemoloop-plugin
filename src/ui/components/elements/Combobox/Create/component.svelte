<script lang="ts">
	import { Combobox } from 'bits-ui';
	import Icon from '../../Icon/component.svelte';
	import type ComboboxCreateProps from './types';

	let { value, label = value, class: className = '' }: ComboboxCreateProps = $props();
</script>

<Combobox.Item {value} {label} class="ml-combobox__create {className}">
	<Icon class="ml-combobox__create-icon" name="plus" size={14} />
	<span class="ml-combobox__create-label">{label}</span>
</Combobox.Item>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-combobox__create) {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		padding: $spacing-xs $spacing-sm;
		font-size: $font-sm;
		color: $interactive-accent;
		cursor: pointer;
		border-radius: $radius-sm;
		transition: background-color $transition-fast;
	}

	:global(.ml-combobox__create:hover),
	:global(.ml-combobox__create[data-highlighted]) {
		background-color: $background-modifier-hover;
	}

	:global(.ml-combobox__create[data-selected]) {
		background-color: $background-modifier-active;
	}

	.ml-combobox__create-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
