<script lang="ts">
	import Icon from '../Icon/component.svelte';
	import { cn } from '../../utils';
	import type ComboboxChipProps from './types';

	let {
		variant = 'filled',
		shape = 'rounded',
		size = 'md',
		class: className = '',
		children,
		onDelete,
		removeLabel = 'Remove item',
		icon,
	}: ComboboxChipProps = $props();
</script>

<span
	class={cn(
		'ml-chip',
		`ml-chip--${variant}`,
		`ml-chip--${shape}`,
		`ml-chip--${size}`,
		{ 'ml-chip--removable': Boolean(onDelete) },
		className,
	)}
>
	<span class="ml-chip__label">{@render children?.()}</span>
	{#if onDelete}
		<button class="ml-chip__remove" type="button" aria-label={removeLabel} onclick={onDelete}>
			<Icon class="ml-chip__remove-icon" name={icon ?? 'x'} size={12} />
		</button>
	{/if}
</span>

<style lang="scss">
	@use 'tokens' as *;
	@use 'breakpoints' as *;

	// Component geometry: the chip capsule; a removable chip grows to the touch
	// target, which is the shared control size.
	$height: 22px;

	.ml-chip {
		display: inline-flex;
		align-items: center;
		gap: $spacing-xxs;
		height: $height;
		min-width: 0;
		max-width: 100%;
		padding: 0 $spacing-xs;
		font-size: $font-xs;
		line-height: 1;
		color: $text-normal;
		white-space: nowrap;

		&--sm {
			padding: 0 $spacing-xs;
			font-size: $font-sm;
		}

		&--md {
			padding: 0 $spacing-sm;
			font-size: $font-md;
		}

		&--lg {
			padding: 0 $spacing-md;
			font-size: $font-lg;
		}
	}

	.ml-chip--filled {
		background-color: $surface-muted;
		border: 1px solid transparent;
	}

	.ml-chip--outline {
		background-color: transparent;
		border: 1px solid $line-subtle;
	}

	.ml-chip--rounded {
		border-radius: $radius-sm;
	}

	.ml-chip--pill {
		border-radius: $radius-pill;
	}

	.ml-chip__label {
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}

	.ml-chip__remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		width: $spacing-md;
		height: $spacing-md;
		margin-inline-end: -$spacing-xxs;
		padding: 0;
		color: $text-muted;
		background: none;
		border: none;
		border-radius: $radius-full;
		cursor: pointer;
		appearance: none;
		box-shadow: none;
		line-height: 0;
	}

	.ml-chip__remove:hover {
		color: $text-normal;
		background-color: $background-modifier-hover;
	}

	.ml-chip__remove:focus-visible {
		outline: 2px solid $interactive-accent;
		outline-offset: 1px;
	}

	.ml-chip__remove-icon {
		pointer-events: none;
	}

	/* Touch, and every viewport narrow enough for the phone layout: the label
	   grows to a legible size. Only a chip that carries its own control is a
	   target and takes the full height. */
	@media (hover: none) and (pointer: coarse), (max-width: $mobile-breakpoint) {
		.ml-chip--removable {
			height: $control-md;
		}

		.ml-chip--removable .ml-chip__remove {
			width: $spacing-lg;
			height: $spacing-lg;
		}
	}
</style>
