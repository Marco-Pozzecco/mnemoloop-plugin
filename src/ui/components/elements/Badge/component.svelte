<script lang="ts">
	import { cn } from '../../utils';
	import type BadgeProps from './types';

	let {
		variant = 'neutral',
		radius = 'sm',
		dot = false,
		class: className,
		children,
	}: BadgeProps = $props();
</script>

<span class={cn('ml-badge', `ml-badge--${variant}`, `ml-badge--${radius}`, className)}>
	{#if dot}
		<span class="ml-badge__dot" aria-hidden="true"></span>
	{/if}
	{@render children?.()}
</span>

<style lang="scss">
	@use 'tokens' as *;

	// Component geometry: the badge capsule and its status dot.
	$height: 22px;
	$dot: 6px;

	.ml-badge {
		display: inline-flex;
		align-items: center;
		gap: $spacing-xxs;
		height: $height;
		padding: 0 $spacing-xs;
		font-family: inherit;
		font-size: $font-xs;
		line-height: 1;
		white-space: nowrap;
		max-width: 100%;
		min-width: $control-md;
		justify-content: center;
	}

	.ml-badge--sm {
		border-radius: $radius-sm;
	}

	.ml-badge--md {
		border-radius: $radius-md;
	}

	.ml-badge--neutral {
		color: $text-normal;
		background-color: $surface-muted;
	}

	.ml-badge--accent {
		color: $text-accent;
		background-color: $background-modifier-selected;
	}

	.ml-badge--success {
		color: $text-success;
		background-color: $status-success-background;
	}

	.ml-badge--warning {
		color: $text-warning;
		background-color: $status-warning-background;
	}

	.ml-badge--error {
		color: $text-error;
		background-color: $status-error-background;
	}

	.ml-badge--ghost {
		color: $text-muted;
		background-color: transparent;
	}

	.ml-badge__dot {
		width: $dot;
		height: $dot;
		flex: 0 0 auto;
		border-radius: $radius-full;
		background-color: currentColor;
	}
</style>
