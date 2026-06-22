<script lang="ts">
	import { NavigationMenu } from 'bits-ui';
	import type NavigationMenuTriggerProps from './types';

	let { disabled = false, className = '', children }: NavigationMenuTriggerProps = $props();
</script>

<NavigationMenu.Trigger {disabled} class="ml-navmenu__trigger {className}">
	{#if children}
		{@render children()}
	{/if}
</NavigationMenu.Trigger>

<style>
	:global(button.ml-navmenu__trigger) {
		display: flex;
		align-items: center;
		gap: var(--ml-spacing-sm);
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

	:global(.ml-navmenu__trigger:hover) {
		background-color: var(--ml-background-modifier-border);
	}

	:global(.ml-navmenu__trigger:hover:not([data-state='open'])) {
		color: var(--text-normal);
	}

	:global(.ml-navmenu__trigger[data-state='open']) {
		color: var(--text-normal);
	}

	:global(.ml-navmenu__trigger[data-disabled]) {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
