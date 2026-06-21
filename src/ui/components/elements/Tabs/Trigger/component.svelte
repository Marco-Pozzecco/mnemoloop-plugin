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

<style>
	:global(button.ml-tabs__trigger) {
		width: 100%;
		padding: var(--ml-padding-sm);
		font-size: var(--font-ui-small);
		color: var(--text-muted);
		cursor: pointer;
		background: none;
		box-shadow: none;
		border: none;
		transition:
			color var(--ml-transition-fast),
			background-color var(--ml-transition-fast);
	}

	:global(.ml-tabs__trigger[data-state='active']) {
		background-color: var(--ml-background-secondary);
	}

	:global(.ml-tabs__trigger:hover:not([data-state='active'])) {
		color: var(--text-normal);
	}

	:global(.ml-tabs__trigger[data-disabled]) {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
