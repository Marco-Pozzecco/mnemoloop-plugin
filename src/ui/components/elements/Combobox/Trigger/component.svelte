<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { getComboboxContext } from '../context';
	import Icon from '../../Icon/component.svelte';
	import { cn } from '@/ui/components/utils';
	import type ComboboxTriggerProps from './types';

	let {
		ref = $bindable(null),
		variant = 'field',
		ariaLabel,
		'aria-label': htmlAriaLabel,
		class: className = '',
		children,
		...rest
	}: ComboboxTriggerProps = $props();

	const context = getComboboxContext();

	$effect(() => {
		context.trigger = ref;
		return () => {
			if (context.trigger === ref) context.trigger = null;
		};
	});
</script>

<Combobox.Trigger
	bind:ref
	{...rest}
	aria-label={ariaLabel ?? htmlAriaLabel ?? 'Open combobox'}
	class={cn('ml-combobox__trigger', `ml-combobox__trigger--${variant}`, className)}
>
	{#if children}
		{@render children()}
	{/if}
	{#if variant === 'field' || !children}
		<Icon class="ml-combobox__chevron" name="chevron-down" size={14} />
	{/if}
</Combobox.Trigger>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-combobox__trigger) {
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		gap: $spacing-xs;
		font-family: inherit;
		font-size: $font-sm;
		text-align: left;
		color: $text-normal;
		cursor: pointer;
		transition:
			color $transition-fast,
			border-color $transition-fast,
			box-shadow $transition-fast;
	}

	:global(.ml-combobox__trigger--field) {
		width: 100%;
		min-height: $control-md;
		padding: $spacing-xs $spacing-sm;
		background-color: $background-primary;
		border: 1px solid $line-subtle;
		border-radius: $radius-md;
	}

	:global(.ml-combobox__trigger--field:hover) {
		border-color: $background-modifier-border-hover;
	}

	:global(.ml-combobox__trigger--field:focus-visible),
	:global(.ml-combobox__trigger--field[data-state='open']) {
		outline: none;
		border-color: $interactive-accent;
		box-shadow: 0 0 0 2px $background-modifier-border-focus;
	}

	:global(.ml-combobox__trigger--bare) {
		padding: 0;
		min-width: 0;
		min-height: 0;
		background: none;
		border: none;
		border-radius: $radius-sm;
	}

	:global(.ml-combobox__trigger--bare:hover) {
		color: $text-normal;
	}

	:global(.ml-combobox__trigger--bare:focus-visible) {
		outline: 2px solid $interactive-accent;
		outline-offset: 2px;
	}

	:global(.ml-combobox__chevron) {
		flex: 0 0 auto;
		color: $text-muted;
	}

	:global(.ml-combobox__trigger[data-state='open'] .ml-icon svg) {
		transform: rotate(180deg);
	}

	@media (pointer: coarse) {
		:global(.ml-combobox__trigger--bare) {
			min-width: $control-md;
			min-height: $control-md;
		}
	}
</style>
