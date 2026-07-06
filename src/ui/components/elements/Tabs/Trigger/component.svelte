<script lang="ts">
	import { Tabs } from 'bits-ui';
	import type TabsTriggerProps from './types';

	let { value, disabled = false, className = '', children }: TabsTriggerProps = $props();
</script>

<Tabs.Trigger {value} {disabled} class="ml-tabs__trigger {className}">
	{#if children}
		{@render children()}
	{/if}
</Tabs.Trigger>

<style lang="scss">
	@use 'tokens' as *;

	:global(button.ml-tabs__trigger) {
		width: 100%;
		padding: $spacing-sm;
		font-size: $font-sm;
		color: $text-muted;
		cursor: pointer;
		background: none;
		box-shadow: none;
		border: none;
		transition:
			color $transition-fast,
			background-color $transition-fast;
	}

	:global(.ml-tabs__trigger[data-state='active']) {
		background-color: $background-secondary;
	}

	:global(.ml-tabs__trigger:hover:not([data-state='active'])) {
		color: $text-normal;
	}

	:global(.ml-tabs__trigger[data-disabled]) {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
