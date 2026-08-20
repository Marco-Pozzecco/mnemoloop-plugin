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
		'ml-button__icon-only': !children,
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

	:global .ml-button[data-button-root='true'] {
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

		&.ml-button--primary {
			background-color: $interactive-accent;
			color: $text-accent-foreground;

			&:hover:not(:disabled) {
				background-color: $interactive-accent-hover;
			}
		}

		&.ml-button--secondary {
			background-color: $background-modifier-border;
			color: $text-normal;
			border: $border-width solid $background-modifier-border-focus;

			&:hover:not(:disabled) {
				background-color: $background-modifier-hover;
			}
		}

		&.ml-button--danger {
			background-color: $text-error;
			color: $text-accent-foreground;

			&:hover:not(:disabled) {
				filter: brightness(1.1);
			}
		}

		&.ml-button--ghost {
			background-color: transparent;
			color: $text-normal;
			border: 1px solid $background-modifier-border;
			box-shadow: none;

			&:hover:not(:disabled) {
				color: $interactive-accent;
			}
		}

		&.ml-button--icon {
			background-color: transparent;
			color: $text-normal;
			box-shadow: none;

			&:hover:not(:disabled) {
				color: $interactive-accent;
			}
		}

		&.ml-button__icon-container:not(.ml-button__icon-only) {
			gap: $spacing-xs;
			align-items: center;
			padding: 0 $spacing-sm 0 $spacing-xs;
		}

		&.ml-button__icon-only {
			padding: 0 $spacing-sm;
		}

		/* Sizes */
		&.ml-button--small {
			min-height: 32px;
			padding: 0 $spacing-sm;
			font-size: $font-xs;
		}

		&.ml-button--medium {
			min-height: 44px;
			padding: 0 $spacing-md;
			font-size: $font-sm;
		}

		&.ml-button--large {
			min-height: 52px;
			padding: 0 $spacing-lg;
			font-size: $font-md;
		}

		/* States */
		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		&:focus-visible {
			outline: 2px solid $interactive-accent;
			outline-offset: 2px;
		}

		/* Mobile-first responsive adjustments */
		@media (max-width: 480px) {
			&.ml-button--small {
				min-height: 40px;
				padding: 0 14px;
			}

			&.ml-button--large {
				width: 100%;
			}
		}
	}
</style>
