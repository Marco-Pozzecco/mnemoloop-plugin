<script lang="ts">
	import { Icon } from '@/ui/components';
	import type CardProps from './types';

	const {
		className,
		title,
		clickable = false,
		hasBorder = true,
		icon,
		padding = 'medium',
		onclick,
		children,
		footer,
	}: CardProps = $props();

	function handleClick() {
		if (onclick) onclick();
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->

<div
	class="ml-card {className}"
	class:has-border={hasBorder}
	class:clickable
	class:padding-none={padding === 'none'}
	class:padding-small={padding === 'small'}
	class:padding-medium={padding === 'medium'}
	class:padding-large={padding === 'large'}
	role={clickable ? 'button' : undefined}
	tabindex={clickable ? 0 : -1}
	onclick={clickable ? handleClick : undefined}
	onkeydown={clickable ? (e) => e.key === 'Enter' && handleClick() : undefined}
>
	{#if title || icon}
		<header class="ml-card-header">
			{#if icon}
				<div class="ml-card-icon">
					<Icon name={icon} size={20} />
				</div>
			{/if}
			{#if title}
				<h3 class="ml-card-title">{title}</h3>
			{/if}
		</header>
	{/if}

	<div class="ml-card-content">
		{#if children}
			{@render children()}
		{/if}
	</div>

	{#if footer}
		<footer class="ml-card-footer">
			{@render footer()}
		</footer>
	{/if}
</div>

<style>
	.ml-card {
		background-color: var(--background-secondary);
		border-radius: var(--card-radius, 8px);
		overflow: hidden;
		transition:
			box-shadow 0.2s ease,
			transform 0.2s ease;
	}

	.ml-card.has-border {
		border: 1px solid var(--background-modifier-border);
	}

	.ml-card.clickable {
		cursor: pointer;
	}

	.ml-card.clickable:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.ml-card.clickable:active {
		transform: translateY(0);
	}

	.ml-card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.ml-card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.ml-card-title {
		margin: 0;
		font-size: var(--font-ui-medium);
		font-weight: var(--font-semibold);
		color: var(--text-normal);
		flex: 1;
	}

	.ml-card-content {
		padding: 1.25rem;
		width: 100%;
		height: fit-content;
	}

	.ml-card-footer {
		padding: 1rem 1.25rem;
		border-top: 1px solid var(--background-modifier-border);
		background-color: var(--background-modifier-hover);
	}

	/* Padding variants */
	.ml-card.padding-none .ml-card-content {
		padding: 0;
	}

	.ml-card.padding-small .ml-card-content {
		padding: 0.75rem;
	}

	.ml-card.padding-medium .ml-card-content {
		padding: 1.25rem;
	}

	.ml-card.padding-large .ml-card-content {
		padding: 1.5rem;
	}

	.ml-card.padding-none .ml-card-header,
	.ml-card.padding-none .ml-card-footer {
		padding: 0.5rem 0.75rem;
	}

	.ml-card.padding-small .ml-card-header,
	.ml-card.padding-small .ml-card-footer {
		padding: 0.75rem 1rem;
	}

	.ml-card.padding-large .ml-card-header,
	.ml-card.padding-large .ml-card-footer {
		padding: 1.25rem 1.5rem;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-card-header,
		.ml-card-content,
		.ml-card-footer {
			padding-left: 1rem;
			padding-right: 1rem;
		}
	}
</style>
