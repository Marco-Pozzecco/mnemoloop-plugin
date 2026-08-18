<script lang="ts">
	import { Combobox } from 'bits-ui';
	import Icon from '../../Icon/component.svelte';
	import type ComboboxTriggerProps from './types';

	let { ariaLabel, class: className = '', children, ...rest }: ComboboxTriggerProps = $props();
</script>

<Combobox.Trigger {...rest} aria-label={ariaLabel} class="ml-combobox__trigger {className}">
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
		outline: none;
	}

	:global(.ml-combobox__trigger[data-state='open'] .ml-icon svg) {
		transform: rotate(180deg);
	}
</style>
