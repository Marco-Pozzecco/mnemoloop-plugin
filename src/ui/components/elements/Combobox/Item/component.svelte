<script lang="ts">
	import { Combobox } from 'bits-ui';
	import ComboboxItemLabel from '../ItemLabel/component.svelte';
	import ComboboxItemIndicator from '../ItemIndicator/component.svelte';
	import type ComboboxItemProps from './types';

	let {
		value,
		label = value,
		disabled = false,
		class: className = '',
		children: content,
		...rest
	}: ComboboxItemProps = $props();
</script>

<Combobox.Item {value} {label} {disabled} class="ml-combobox__item {className}" {...rest}>
	{#snippet children({ selected })}
		{#if content}
			{@render content({ selected })}
		{:else}
			<ComboboxItemLabel>{label}</ComboboxItemLabel>
			{#if selected}
				<ComboboxItemIndicator />
			{/if}
		{/if}
	{/snippet}
</Combobox.Item>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-combobox__item) {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		padding: $spacing-xs $spacing-sm;
		font-size: $font-sm;
		color: $text-normal;
		cursor: pointer;
		border-radius: $radius-sm;
		transition: background-color $transition-fast;
	}

	:global(.ml-combobox__item:hover:not([data-disabled])) {
		background-color: $background-modifier-hover;
	}

	:global(.ml-combobox__item[data-highlighted]) {
		background-color: $background-modifier-hover;
		outline: none;
	}

	:global(.ml-combobox__item[data-selected]) {
		background-color: $background-modifier-active;
	}

	:global(.ml-combobox__item[data-disabled]) {
		color: $text-muted;
		cursor: not-allowed;
		opacity: 0.5;
	}
</style>
