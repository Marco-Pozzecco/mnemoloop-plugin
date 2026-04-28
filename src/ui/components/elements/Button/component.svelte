<script lang="ts">
	import { Button } from 'bits-ui';
	import type ButtonProps from './types';

	let {
		ariaLabel,
		className,
		disabled = false,
		onclick,
		size = 'medium',
		type = 'button',
		variant = 'secondary',
		children,
	}: ButtonProps = $props();
</script>

<Button.Root
	{disabled}
	{onclick}
	{type}
	aria-label={ariaLabel}
	class="ka-button ka-button--{variant} ka-button--{size} {className}"
>
	{#if children}
		{@render children()}
	{/if}
</Button.Root>

<style>
	:global(button.ka-button) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: inherit;
		font-weight: var(--font-medium);
		border-radius: var(--button-radius);
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease,
			opacity 0.15s ease;
		border: 1px solid transparent;
		user-select: none;
		white-space: nowrap;

		/* Ensure minimum touch target size for accessibility */
		min-height: 44px;
		padding: 0 16px;
	}

	/* Variants */
	:global(button.ka-button--primary) {
		background-color: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	:global(button.ka-button--primary:hover:not(:disabled)) {
		background-color: var(--interactive-accent-hover);
	}

	:global(button.ka-button--secondary) {
		background-color: var(--button-secondary-background, var(--background-modifier-border));
		color: var(--text-normal);
		border: 1px solid var(--background-modifier-border-focus);
	}

	:global(button.ka-button--secondary:hover:not(:disabled)) {
		background-color: var(--background-modifier-hover);
	}

	:global(button.ka-button--danger) {
		background-color: var(--text-error);
		color: var(--text-on-accent);
	}

	:global(button.ka-button--danger:hover:not(:disabled)) {
		filter: brightness(1.1);
	}

	:global(button.ka-button--ghost) {
		background-color: transparent;
		color: var(--text-normal);
		border: 1px solid var(--background-modifier-border);
		box-shadow: none;
	}

	:global(button.ka-button--ghost:hover:not(:disabled)) {
		color: var(--interactive-accent);
	}

	/* Sizes */
	:global(button.ka-button--small) {
		min-height: 32px;
		padding: 0 12px;
		font-size: var(--font-ui-smaller);
	}

	:global(button.ka-button--medium) {
		min-height: 44px;
		padding: 0 20px;
		font-size: var(--font-ui-small);
	}

	:global(button.ka-button--large) {
		min-height: 52px;
		padding: 0 28px;
		font-size: var(--font-ui-medium);
	}

	/* States */
	:global(button.ka-button:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global(button.ka-button:focus-visible) {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 2px;
	}

	/* Mobile-first responsive adjustments */
	@media (max-width: 480px) {
		:global(button.ka-button--large) {
			width: 100%;
		}
	}
</style>
