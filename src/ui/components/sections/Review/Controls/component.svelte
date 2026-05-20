<script lang="ts">
	import { Button, Icon } from '@/ui/components';
	import type { RatingButton } from './types';
	import type RatingControlsProps from './types';

	// props
	let { onSubmitRating, disabled = false }: RatingControlsProps = $props();

	const ratings: RatingButton[] = [
		{ value: 1, label: 'Again', color: 'var(--text-error)', icon: 'refresh-ccw', shortcut: '1' },
		{ value: 2, label: 'Hard', color: 'var(--text-warning)', icon: 'trending-up', shortcut: '2' },
		{ value: 3, label: 'Good', color: 'var(--text-accent)', icon: 'check', shortcut: '3' },
		{ value: 4, label: 'Easy', color: 'var(--text-success)', icon: 'zap', shortcut: '4' },
	];
</script>

<div class="ml-rating-controls" class:disabled>
	{#each ratings as rating (rating.value)}
		<div class="ml-rating-button-wrapper">
			<Button
				variant="primary"
				className="ml-rating-button"
				onclick={() => !disabled && onSubmitRating(rating.value)}
				{disabled}
				ariaLabel="Rate as {rating.label}"
			>
				<div class="ml-rating-button-content">
					<Icon name={rating.icon || ''} size={18} />
					<span class="ml-rating-label">{rating.label}</span>
				</div>
			</Button>
			<span class="ml-rating-shortcut">{rating.shortcut}</span>
		</div>
	{/each}
</div>

<style>
	.ml-rating-controls {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		width: 100%;
		margin-top: 1.5rem;
	}

	.ml-rating-controls.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.ml-rating-button-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	:global(.ml-rating-button) {
		width: 100%;
		height: 60px !important;
		border-color: var(--background-modifier-border) !important;
		transition: all 0.2s ease !important;
	}

	:global(.ml-rating-button:hover) {
		border-color: var(--button-color) !important;
		background-color: var(--background-secondary) !important;
		color: var(--button-color) !important;
	}

	.ml-rating-button-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.ml-rating-label {
		font-size: 0.8rem;
		font-weight: 500;
	}

	.ml-rating-shortcut {
		font-size: 0.7rem;
		color: var(--text-muted);
		background-color: var(--background-secondary);
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid var(--background-modifier-border);
	}

	/* Mobile optimizations */
	@media (max-width: 480px) {
		.ml-rating-controls {
			gap: 0.75rem;
			grid-template-columns: repeat(2, 1fr);
			margin-top: 1rem;
		}

		:global(.ml-rating-button) {
			height: 56px !important;
			padding: 0.5rem !important;
		}

		.ml-rating-label {
			font-size: 0.85rem;
		}

		.ml-rating-shortcut {
			display: none;
		}
	}
</style>
