<script lang="ts">
	import AutoReviewControls from './Auto/component.svelte';
	import ManualReviewControls from './Manual/component.svelte';
	import { CardType } from '@/schemas';
	import type ScoreControlsProps from './types';

	let {
		cardType,
		disabled,
		onSubmitRating,
		onContinue,
		isCorrect: sequenceIsCorrect,
	}: ScoreControlsProps = $props();

	// Registry: card types that auto-score (render AutoReviewControls).
	// To add a new auto-scored card type, add its CardType here — no other edits needed.
	const AUTO_SCORED_TYPES = new Set<CardType>([CardType.Sequence]);

	let isAutoScored = $derived(AUTO_SCORED_TYPES.has(cardType));
</script>

{#if isAutoScored}
	<AutoReviewControls isCorrect={sequenceIsCorrect ?? false} {disabled} {onContinue} />
{:else}
	<ManualReviewControls {disabled} {onSubmitRating} />
{/if}
