<script lang="ts">
	import { Badge, ManageDeckChips } from '@/ui/components';
	import { cardTypeLabel } from '@/ui/components/sections/Manage/options';
	import { cn } from '@/ui/components/utils';
	import { formatDate } from '@/utils/statistics-utils';
	import type Props from './types.ts';

	const { card, preview, className }: Props = $props();
</script>

<div class={cn('ml-sidebar-flashcard', className)}>
	<span class="ml-sidebar-flashcard__meta">
		<Badge variant="neutral">{cardTypeLabel(card.card_type)}</Badge>
		<span class="ml-sidebar-flashcard__spacer"></span>
		<span class="ml-sidebar-flashcard__due">Due: {formatDate(new Date(card.due))}</span>
	</span>
	<span class="ml-sidebar-flashcard__preview">{preview}</span>

	<span class="ml-sidebar-flashcard__decks">
		<ManageDeckChips decks={card.decks} max={2} />
	</span>
</div>

<style lang="scss">
	@use 'tokens' as *;
	// Component geometry: the mobile scan card, sized so four fit the first screen.
	$card-height: 116px;

	.ml-sidebar-flashcard {
		display: flex;
		flex-direction: column;
		gap: $spacing-xxs;
		min-height: $card-height;
		padding: $spacing-sm;
		color: $text-normal;
		background-color: $surface-raised;
		border: 1px solid $line-subtle;
		border-radius: $radius-md;
	}

	.ml-sidebar-flashcard:hover {
		border-color: $line-strong;
	}

	.ml-sidebar-flashcard__meta {
		display: flex;
		align-items: center;
		gap: $spacing-xxs;
		min-width: 0;
	}

	.ml-sidebar-flashcard__spacer {
		flex: 1;
	}

	.ml-sidebar-flashcard__due {
		font-size: $font-xs;
		color: $text-faint;
		white-space: nowrap;
	}

	.ml-sidebar-flashcard__preview {
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		font-size: $font-sm;
		line-height: 1.4;
		color: $text-normal;
	}

	.ml-sidebar-flashcard__decks {
		display: flex;
		min-width: 0;
		margin-top: auto;
	}
</style>
