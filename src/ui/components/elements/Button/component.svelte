<script lang="ts">
	import { Button } from 'bits-ui';
	import type ButtonProps from './types';
	import { cn } from '../../utils';

	let {
		ariaLabel,
		disabled = false,
		class: className,
		onclick,
		size = 'medium',
		type = 'button',
		variant = 'secondary',
		children,
		icon,
	}: ButtonProps = $props();
</script>

<Button.Root
	{disabled}
	{onclick}
	{type}
	aria-label={ariaLabel}
	class={cn('ml-button', `ml-button--${variant}`, `ml-button--${size}`, className, {
		'ml-button__icon-container': !!icon,
	})}
>
	{#if icon}
		{@render icon()}
	{/if}
	{#if children}
		{@render children()}
	{/if}
</Button.Root>

<style lang="scss">
	@use 'tokens' as *;

	:global(button.ml-button) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: inherit;
		font-weight: $font-md;
		border-radius: $radius-md;
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
	:global(button.ml-button--primary) {
		background-color: $interactive-accent;
		color: $text-accent-foreground;
	}

	:global(button.ml-button--primary:hover:not(:disabled)) {
		background-color: $interactive-accent-hover;
	}

	:global(button.ml-button--secondary) {
		background-color: $background-modifier-border;
		color: $text-normal;
		border: $border-width solid $background-modifier-border-focus;
	}

	:global(button.ml-button--secondary:hover:not(:disabled)) {
		background-color: $background-modifier-hover;
	}

	:global(button.ml-button--danger) {
		background-color: -error;
		color: $text-accent-foreground;
	}

	:global(button.ml-button--danger:hover:not(:disabled)) {
		filter: brightness(1.1);
	}

	:global(button.ml-button--ghost) {
		background-color: transparent;
		color: $text-normal;
		border: 1px solid $background-modifier-border;
		box-shadow: none;
	}

	:global(button.ml-button--ghost:hover:not(:disabled)) {
		color: $interactive-accent;
	}

	:global(button.ml-button--icon) {
		background-color: transparent;
		color: $text-normal;
		box-shadow: none;
	}

	:global(button.ml-button--icon:hover:not(:disabled)) {
		color: $interactive-accent;
	}

	:global(button.ml-button__icon-container) {
		gap: $spacing-sm;
		align-items: center;
	}

	/* Sizes */
	:global(button.ml-button--small) {
		min-height: 32px;
		padding: 0 12px;
		font-size: $font-xs;
	}

	:global(button.ml-button--medium) {
		min-height: 44px;
		padding: 0 20px;
		font-size: $font-sm;
	}

	:global(button.ml-button--large) {
		min-height: 52px;
		padding: 0 28px;
		font-size: $font-md;
	}

	/* States */
	:global(button.ml-button:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	:global(button.ml-button:focus-visible) {
		outline: 2px solid $interactive-accent;
		outline-offset: 2px;
	}

	/* Mobile-first responsive adjustments */
	@media (max-width: 480px) {
		:global(button.ml-button--small) {
			min-height: 40px;
			padding: 0 14px;
		}

		:global(button.ml-button--large) {
			width: 100%;
		}
	}
</style>
