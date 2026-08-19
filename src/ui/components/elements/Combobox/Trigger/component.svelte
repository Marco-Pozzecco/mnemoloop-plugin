<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { getComboboxContext } from '../context';
	import Icon from '../../Icon/component.svelte';
	import type ComboboxTriggerProps from './types';

	let {
		ref = $bindable(null),
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
	class="ml-combobox__trigger {className}"
>
	{#if children}
		{@render children()}
	{:else}
		<Icon name="chevron-down" size={14} />
	{/if}
</Combobox.Trigger>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-combobox__trigger) {
		position: absolute;
		right: 4px;
		top: 50%;
		transform: translateY(-50%);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: $spacing-xxs;
		min-width: 32px;
		min-height: 32px;
		color: $text-muted;
		background: none;
		border: none;
		border-radius: $radius-sm;
		cursor: pointer;
		transition: color $transition-fast;
	}

	:global(.ml-combobox__trigger:hover) {
		color: $text-normal;
	}

	:global(.ml-combobox__trigger:focus-visible) {
		color: $interactive-accent;
		outline: 2px solid $interactive-accent;
		outline-offset: 2px;
	}

	@media (pointer: coarse) {
		:global(.ml-combobox__trigger) {
			min-width: 44px;
			min-height: 44px;
		}
	}

	:global(.ml-combobox__trigger[data-state='open'] .ml-icon svg) {
		transform: rotate(180deg);
	}
</style>
