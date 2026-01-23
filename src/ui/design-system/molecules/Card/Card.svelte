<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from '../atoms/Icon.svelte';
	import type { CardProps } from './Card.types';

	/**
	 * Optional card title
	 */
	export let title: CardProps['title'] = undefined;

	/**
	 * Whether the card has a border
	 */
	export let hasBorder: CardProps['hasBorder'] = true;

	/**
	 * Card padding variant
	 */
	export let padding: CardProps['padding'] = 'medium';

	/**
	 * Optional card icon
	 */
	export let icon: CardProps['icon'] = undefined;

	/**
	 * Whether the card is clickable
	 */
	export let clickable: CardProps['clickable'] = false;

	/**
	 * Additional CSS classes
	 */
	let className: string = '';
	export { className as class };

	const dispatch = createEventDispatcher<{
		click: MouseEvent;
	}>();

	function handleClick(event: MouseEvent) {
		if (clickable) {
			dispatch('click', event);
		}
	}
</script>

<article
	class="ka-card {className}"
	class:has-border={hasBorder}
	class:clickable={clickable}
	class:padding-none={padding === 'none'}
	class:padding-small={padding === 'small'}
	class:padding-medium={padding === 'medium'}
	class:padding-large={padding === 'large'}
	role={clickable ? 'button' : undefined}
	tabindex={clickable ? '0' : undefined}
	on:click={handleClick}
	on:keydown={clickable ? (e) => e.key === 'Enter' && handleClick(e) : undefined}
>
	{#if title || icon}
		<header class="ka-card-header">
			{#if icon}
				<div class="ka-card-icon">
					<Icon name={icon} size={20} />
				</div>
			{/if}
			{#if title}
				<h3 class="ka-card-title">{title}</h3>
			{/if}
		</header>
	{/if}

	<div class="ka-card-content">
		<slot name="content">
			<slot />
		</slot>
	</div>

	{#if $$slots.footer}
		<footer class="ka-card-footer">
			<slot name="footer" />
		</footer>
	{/if}
</article>

<style>
	.ka-card {
		background-color: var(--background-secondary);
		border-radius: var(--card-radius, 8px);
		overflow: hidden;
		transition: box-shadow 0.2s ease, transform 0.2s ease;
	}

	.ka-card.has-border {
		border: 1px solid var(--background-modifier-border);
	}

	.ka-card.clickable {
		cursor: pointer;
	}

	.ka-card.clickable:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.ka-card.clickable:active {
		transform: translateY(0);
	}

	.ka-card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.ka-card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.ka-card-title {
		margin: 0;
		font-size: var(--font-ui-medium);
		font-weight: var(--font-semibold);
		color: var(--text-normal);
		flex: 1;
	}

	.ka-card-content {
		padding: 1.25rem;
	}

	.ka-card-footer {
		padding: 1rem 1.25rem;
		border-top: 1px solid var(--background-modifier-border);
		background-color: var(--background-modifier-hover);
	}

	/* Padding variants */
	.ka-card.padding-none .ka-card-content {
		padding: 0;
	}

	.ka-card.padding-small .ka-card-content {
		padding: 0.75rem;
	}

	.ka-card.padding-medium .ka-card-content {
		padding: 1.25rem;
	}

	.ka-card.padding-large .ka-card-content {
		padding: 1.5rem;
	}

	.ka-card.padding-none .ka-card-header,
	.ka-card.padding-none .ka-card-footer {
		padding: 0.5rem 0.75rem;
	}

	.ka-card.padding-small .ka-card-header,
	.ka-card.padding-small .ka-card-footer {
		padding: 0.75rem 1rem;
	}

	.ka-card.padding-large .ka-card-header,
	.ka-card.padding-large .ka-card-footer {
		padding: 1.25rem 1.5rem;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ka-card-header,
		.ka-card-content,
		.ka-card-footer {
			padding-left: 1rem;
			padding-right: 1rem;
		}
	}
</style>
