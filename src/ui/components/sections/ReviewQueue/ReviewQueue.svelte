<script lang="ts">
	import { Card, Icon, Button } from '@/ui/components';
	/**
	 * Review queue data
	 */
	export let queue: Array<{
		id: string;
		front: string;
		back: string;
		dueDate: Date;
		difficulty?: 'easy' | 'medium' | 'hard';
		tags?: string[];
	}> = [];

	/**
	 * Whether the queue is empty
	 */
	export let isEmpty: boolean = false;

	/**
	 * Empty state message
	 */
	export let emptyMessage: string = 'No cards due for review';

	/**
	 * Maximum number of cards to display
	 */
	export let maxDisplay: number = 5;

	/**
	 * Whether to show tags
	 */
	export let showTags: boolean = true;

	// const dispatch = createEventDispatcher<{
	// 	cardSelect: string;
	// 	cardView: string;
	// }>();

	$: displayQueue = queue.slice(0, maxDisplay);
	$: hasOverflow = queue.length > maxDisplay;

	function handleCardSelect(cardId: string) {
		// dispatch('cardSelect', cardId);
	}

	function handleCardView(cardId: string) {
		// dispatch('cardView', cardId);
	}
</script>

<div class="ka-review-queue">
	<Card title="Review Queue" icon="list">
		{#if isEmpty || displayQueue.length === 0}
			<div class="ka-empty-state">
				<Icon name="inbox" size={48} color="var(--text-muted)" />
				<p class="ka-empty-message">{emptyMessage}</p>
			</div>
		{:else}
			<div class="ka-queue-list">
				{#each displayQueue as card (card.id)}
					<div
						class="ka-queue-card"
						class:difficulty-easy={card.difficulty === 'easy'}
						class:difficulty-medium={card.difficulty === 'medium'}
						class:difficulty-hard={card.difficulty === 'hard'}
						role="button"
						tabindex="0"
						on:click={() => handleCardSelect(card.id)}
						on:keydown={(e) => e.key === 'Enter' && handleCardSelect(card.id)}
					>
						<div class="ka-queue-card-main">
							<div class="ka-queue-card-front">{card.front}</div>
							{#if showTags && card.tags && card.tags.length > 0}
								<div class="ka-queue-card-tags">
									{#each card.tags as tag}
										<span class="ka-tag">{tag}</span>
									{/each}
								</div>
							{/if}
						</div>
						<div class="ka-queue-card-actions">
							{#if card.difficulty}
								<div class="ka-difficulty-badge">
									<Icon
										name={card.difficulty === 'easy'
											? 'zap'
											: card.difficulty === 'hard'
												? 'flame'
												: 'minus'}
										size={14}
									/>
									<span>{card.difficulty}</span>
								</div>
							{/if}
							<Button variant="secondary" size="small" onclick={() => handleCardView(card.id)}>
								<Icon name="eye" size={14} />
							</Button>
						</div>
					</div>
				{/each}

				{#if hasOverflow}
					<div class="ka-queue-more">
						<p class="ka-more-text">+{queue.length - maxDisplay} more cards</p>
					</div>
				{/if}
			</div>
		{/if}

		{#if !isEmpty && queue.length > 0}
			<div class="ka-queue-footer">
				<div class="ka-queue-stats">
					<span class="ka-stat-badge">
						<Icon name="layers" size={14} />
						{queue.length} cards
					</span>
				</div>
			</div>
		{/if}
	</Card>
</div>

<style>
	.ka-review-queue {
		width: 100%;
	}

	.ka-empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		gap: 1rem;
		text-align: center;
	}

	.ka-empty-message {
		margin: 0;
		font-size: var(--font-ui-small);
		color: var(--text-muted);
	}

	.ka-queue-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.ka-queue-card {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.875rem;
		background-color: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 6px;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.ka-queue-card:hover {
		border-color: var(--interactive-accent);
		background-color: var(--background-modifier-hover);
		transform: translateX(4px);
	}

	.ka-queue-card:focus-visible {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 2px;
	}

	.ka-queue-card.difficulty-easy {
		border-left: 3px solid var(--text-success);
	}

	.ka-queue-card.difficulty-medium {
		border-left: 3px solid var(--text-warning);
	}

	.ka-queue-card.difficulty-hard {
		border-left: 3px solid var(--text-error);
	}

	.ka-queue-card-main {
		flex: 1;
		min-width: 0;
	}

	.ka-queue-card-front {
		font-size: var(--font-ui-small);
		color: var(--text-normal);
		line-height: 1.4;
		margin-bottom: 0.5rem;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.ka-queue-card-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.ka-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.125rem 0.5rem;
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
		background-color: var(--background-modifier-border);
		border-radius: 4px;
	}

	.ka-queue-card-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.ka-difficulty-badge {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		font-size: var(--font-ui-smaller);
		font-weight: var(--font-medium);
		background-color: var(--background-modifier-border);
		border-radius: 4px;
	}

	.ka-difficulty-badge span {
		text-transform: capitalize;
	}

	.ka-queue-more {
		padding: 0.75rem;
		text-align: center;
		background-color: var(--background-modifier-hover);
		border-radius: 6px;
		margin-top: 0.5rem;
	}

	.ka-more-text {
		margin: 0;
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
	}

	.ka-queue-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.ka-queue-stats {
		display: flex;
		gap: 0.75rem;
	}

	.ka-stat-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		font-size: var(--font-ui-smaller);
		color: var(--text-normal);
		background-color: var(--background-modifier-border);
		border-radius: 4px;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ka-queue-card {
			padding: 0.75rem;
			flex-direction: column;
		}

		.ka-queue-card-front {
			font-size: var(--font-ui-smaller);
		}

		.ka-queue-card-actions {
			width: 100%;
			justify-content: space-between;
		}

		.ka-queue-footer {
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>
