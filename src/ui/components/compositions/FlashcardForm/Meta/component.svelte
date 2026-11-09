<script lang="ts">
	import type { Flashcard } from '@/schemas';
	import { Badge } from '@/ui/components/elements';
	import {
		MANAGE_STATUS_VARIANT,
		cardTypeLabel,
	} from '@/ui/components/sections/Manage/options';
	import { formatDate } from '@/utils/statistics-utils';
	import type FlashcardFormMetaProps from './types';

	let { card, status }: FlashcardFormMetaProps = $props();

	const dueLabel = $derived(card ? formatDue(card.due) : '');

	function formatDue(value: Flashcard['due'] | undefined): string {
		if (value === undefined) return '';
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? '' : formatDate(date);
	}
</script>

<div class="ml-flashcard-form__meta">
	<Badge variant="neutral">{cardTypeLabel(card?.card_type)}</Badge>
	<Badge variant={MANAGE_STATUS_VARIANT[status] ?? 'neutral'} radius="md">{status}</Badge>
	<span class="ml-flashcard-form__due">Due {dueLabel}</span>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-flashcard-form__meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: $spacing-xs;
	}

	.ml-flashcard-form__due {
		font-size: $font-xs;
		color: $text-faint;
	}
</style>
