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

<div class="ka-rating-controls" class:disabled>
	{#each ratings as rating}
		<div class="ka-rating-button-wrapper">
			<!-- style="--button-color: {rating.color}" -->
			<Button
				variant="primary"
				className="ka-rating-button"
				onclick={() => !disabled && onSubmitRating(rating.value)}
				{disabled}
				ariaLabel="Rate as {rating.label}"
			>
				<div class="ka-rating-button-content">
					<Icon name={rating.icon || ''} size={18} />
					<span class="ka-rating-label">{rating.label}</span>
				</div>
			</Button>
			<span class="ka-rating-shortcut">{rating.shortcut}</span>
		</div>
	{/each}
</div>

<style>
	.ka-rating-controls {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		width: 100%;
		margin-top: 1.5rem;
	}

	.ka-rating-controls.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.ka-rating-button-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	:global(.ka-rating-button) {
		width: 100%;
		height: 60px !important;
		border-color: var(--background-modifier-border) !important;
		transition: all 0.2s ease !important;
	}

	:global(.ka-rating-button:hover) {
		border-color: var(--button-color) !important;
		background-color: var(--background-secondary) !important;
		color: var(--button-color) !important;
	}

	.ka-rating-button-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.ka-rating-label {
		font-size: 0.8rem;
		font-weight: 500;
	}

	.ka-rating-shortcut {
		font-size: 0.7rem;
		color: var(--text-muted);
		background-color: var(--background-secondary);
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid var(--background-modifier-border);
	}

	/* Mobile optimizations */
	@media (max-width: 480px) {
		.ka-rating-controls {
			gap: 0.5rem;
		}

		:global(.ka-rating-button) {
			height: 50px !important;
			padding: 0.5rem !important;
		}

		.ka-rating-label {
			font-size: 0.7rem;
		}

		.ka-rating-shortcut {
			display: none;
		}
	}
</style>
