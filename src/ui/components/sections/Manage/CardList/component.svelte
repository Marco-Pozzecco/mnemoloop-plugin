<script lang="ts">
	import type { FlashcardMetadata } from '@/schemas';
	import { Badge, Icon } from '@/ui/components/elements';
	import { formatDate } from '@/utils/statistics-utils';
	import ManageDeckChips from '../DeckChips/component.svelte';
	import { MANAGE_STATUS_VARIANT, cardTypeLabel } from '../options';
	import type ManageCardListProps from './types';

	let { cards, previews, hrefFor, onOpen, className = '' }: ManageCardListProps = $props();

	function handleClick(event: MouseEvent, card: FlashcardMetadata): void {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}
		event.preventDefault();
		onOpen(card);
	}
</script>

<div class="ml-manage-cards {className}">
	{#each cards as card (card.uuid)}
		<a class="ml-manage-card" href={hrefFor(card)} onclick={(event) => handleClick(event, card)}>
			<span class="ml-manage-card__meta">
				<Badge variant="neutral">{cardTypeLabel(card.card_type)}</Badge>
				<Badge variant={MANAGE_STATUS_VARIANT[card.status] ?? 'neutral'} radius="md">
					{card.status}
				</Badge>
				<span class="ml-manage-card__spacer"></span>
				<span class="ml-manage-card__due">Due: {formatDate(new Date(card.due))}</span>
				<Icon class="ml-manage-card__chevron" name="chevron-right" size={16} />
			</span>
			<span class="ml-manage-card__preview">{previews[card.file] ?? 'Loading…'}</span>

			<span class="ml-manage-card__decks">
				<ManageDeckChips decks={card.decks} max={2} />
			</span>
		</a>
	{/each}
</div>

<style lang="scss">
	@use 'tokens' as *;

	// Component geometry: the mobile scan card, sized so four fit the first screen.
	$card-height: 116px;

	.ml-manage-cards {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
	}

	.ml-manage-card {
		display: flex;
		flex-direction: column;
		gap: $spacing-xxs;
		min-height: $card-height;
		padding: $spacing-sm;
		text-decoration: none;
		color: $text-normal;
		background-color: $surface-raised;
		border: 1px solid $line-subtle;
		border-radius: $radius-md;
	}

	.ml-manage-card:hover {
		border-color: $line-strong;
	}

	/* Inset so the ring survives in clipped containers, such as the sidebar's
	   collapsible group content. */
	.ml-manage-card:focus-visible {
		outline: 2px solid $interactive-accent;
		outline-offset: -2px;
	}

	.ml-manage-card__meta {
		display: flex;
		align-items: center;
		gap: $spacing-xxs;
		min-width: 0;
	}

	.ml-manage-card__spacer {
		flex: 1;
	}

	.ml-manage-card__due {
		font-size: $font-xs;
		color: $text-faint;
		white-space: nowrap;
	}

	.ml-manage-card__chevron {
		flex: 0 0 auto;
		color: $text-faint;
	}

	.ml-manage-card__preview {
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		font-size: $font-sm;
		line-height: 1.4;
		color: $text-normal;
	}

	.ml-manage-card__decks {
		display: flex;
		min-width: 0;
		margin-top: auto;
	}
</style>
