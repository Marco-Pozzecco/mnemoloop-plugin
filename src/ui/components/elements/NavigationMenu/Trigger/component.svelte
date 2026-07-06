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

<style lang="scss">
	@use 'tokens' as *;

	:global(button.ml-navmenu__trigger) {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
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

	:global(.ml-navmenu__trigger:hover) {
		background-color: $background-modifier-border;
	}

	:global(.ml-navmenu__trigger:hover:not([data-state='open'])) {
		color: $text-normal;
	}

	:global(.ml-navmenu__trigger[data-state='open']) {
		color: $text-normal;
	}

	:global(.ml-navmenu__trigger[data-disabled]) {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
