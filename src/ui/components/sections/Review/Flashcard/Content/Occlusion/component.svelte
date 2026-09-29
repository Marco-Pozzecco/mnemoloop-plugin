<script lang="ts">
	import type { FlashcardOcclusionContent, FlashcardOcclusionMask } from '@/schemas';
	import { getAppContext } from '@/ui/context/AppContext';
	import type { FlashcardContentProps } from '../types';
	import { fisherYatesShuffle } from '../utils';
	import { hitTestMasks } from './utils';

	/** Smallest comfortable touch target, in CSS pixels. */
	const MIN_HIT_SIZE = 44;

	let {
		content,
		sourcePath,
		isAnswerShowing,
		onAllRevealed,
		onShowAnswer,
		onSetAnswerCorrectness,
	}: FlashcardContentProps<FlashcardOcclusionContent> = $props();

	const { app } = getAppContext();

	let imageRef: HTMLDivElement;
	let shuffledMasks = $state<FlashcardOcclusionMask[]>([]);
	let promptIndex = $state(0);
	let isComplete = $state(false);
	let lastContentKey = $state('');
	let revealedIds = $state<string[]>([]);
	let missedIds = $state<string[]>([]);

	const currentPrompt = $derived(shuffledMasks[promptIndex] ?? null);
	const hasDimensions = $derived(!!content?.width && !!content?.height);
	const imageFile = $derived(
		content ? app.metadataCache.getFirstLinkpathDest(content.image, sourcePath) : null,
	);
	const imageUrl = $derived(imageFile ? app.vault.getResourcePath(imageFile) : null);
	const outcomeCorrect = $derived(isComplete && missedIds.length === 0);

	$effect(() => {
		const key = content ? JSON.stringify(content) : '';
		if (key === lastContentKey) return;
		lastContentKey = key;

		revealedIds = [];
		missedIds = [];
		isComplete = false;
		promptIndex = 0;
		shuffledMasks = content ? fisherYatesShuffle(content.masks) : [];
	});

	$effect(() => {
		onSetAnswerCorrectness?.(outcomeCorrect);
	});

	function select(mask: FlashcardOcclusionMask | null): void {
		if (!mask || isComplete || isAnswerShowing) return;
		const prompted = currentPrompt;
		if (!prompted) return;

		const isCorrect = mask.answer === prompted.answer;
		revealedIds = [...revealedIds, mask.id];
		if (!isCorrect) {
			// Show the region the prompt was asking for as well.
			revealedIds = [...revealedIds, prompted.id];
			missedIds = [...missedIds, prompted.id];
		}

		if (promptIndex + 1 >= shuffledMasks.length) {
			complete();
		} else {
			promptIndex += 1;
		}
	}

	/** The prompt loop ended on its own: reveal what is left and report the outcome. */
	function complete(): void {
		isComplete = true;
		revealedIds = shuffledMasks.map((mask) => mask.id);
		onAllRevealed?.();
		onShowAnswer?.();
	}

	/** The learner ended the card early: unanswered prompts count as incorrect. */
	function revealAll(): void {
		if (isComplete) return;
		for (const mask of shuffledMasks) {
			if (!revealedIds.includes(mask.id)) {
				revealedIds = [...revealedIds, mask.id];
				missedIds = [...missedIds, mask.id];
			}
		}
		complete();
	}

	function hitSize(): { width: number; height: number } | null {
		const rect = imageRef?.getBoundingClientRect();
		if (!rect || rect.width <= 0 || rect.height <= 0) return null;
		return { width: MIN_HIT_SIZE / rect.width, height: MIN_HIT_SIZE / rect.height };
	}

	function handleRegionClick(event: MouseEvent, mask: FlashcardOcclusionMask): void {
		const rect = imageRef?.getBoundingClientRect();
		const minSize = hitSize();
		if (rect && minSize) {
			const point = {
				x: (event.clientX - rect.left) / rect.width,
				y: (event.clientY - rect.top) / rect.height,
			};
			const hit = hitTestMasks(content?.masks ?? [], point, minSize);
			if (hit) {
				select(hit);
				return;
			}
		}
		select(mask);
	}

	function handleRegionKeyDown(event: KeyboardEvent, mask: FlashcardOcclusionMask): void {
		if (event.key !== 'Enter' && event.key !== ' ' && event.code !== 'Space') return;
		event.preventDefault();
		select(mask);
	}

	function maskStyle(mask: FlashcardOcclusionMask): string {
		const [x, y, width, height] = mask.rect;
		return `left: ${x * 100}%; top: ${y * 100}%; width: ${width * 100}%; height: ${height * 100}%`;
	}
</script>

{#if content}
	<div class="ml-occlusion-content">
		<div class="ml-occlusion-prompt" role="status" aria-live="polite">
			{#if currentPrompt && !isComplete}
				<span class="ml-occlusion-prompt__label">Click:</span>
				<span class="ml-occlusion-prompt__answer">{currentPrompt.answer}</span>
			{:else}
				<span class="ml-occlusion-prompt__label">All regions revealed</span>
			{/if}
		</div>

		<div
			bind:this={imageRef}
			class="ml-occlusion-image"
			class:ml-occlusion-image--sized={hasDimensions}
			style={hasDimensions ? `aspect-ratio: ${content.width} / ${content.height}` : ''}
		>
			{#if imageUrl}
				<img class="ml-occlusion-image__img" src={imageUrl} alt={content.image} />
			{:else}
				<div class="ml-occlusion-missing" role="alert">
					<p class="ml-occlusion-missing__title">Image not found</p>
					<p class="ml-occlusion-missing__reference">{content.image}</p>
				</div>
			{/if}

			{#each content.masks as mask (mask.id)}
				{@const isRevealed = revealedIds.includes(mask.id)}
				<button
					type="button"
					class="ml-occlusion-mask"
					class:ml-occlusion-mask--revealed={isRevealed}
					class:ml-occlusion-mask--missed={missedIds.includes(mask.id)}
					style={maskStyle(mask)}
					aria-label={mask.answer}
					aria-pressed={isRevealed}
					disabled={isComplete}
					onclick={(event) => handleRegionClick(event, mask)}
					onkeydown={(event) => handleRegionKeyDown(event, mask)}
				>
					{#if isRevealed}
						<span class="ml-occlusion-mask__answer">{mask.answer}</span>
					{/if}
				</button>
			{/each}
		</div>

		{#if !isComplete}
			<button type="button" class="ml-occlusion-reveal-all" onclick={revealAll}>
				Reveal all
			</button>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use 'tokens' as *;

	.ml-occlusion-content {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
	}

	.ml-occlusion-prompt {
		display: flex;
		gap: $spacing-xs;
		align-items: baseline;

		&__label {
			color: $text-muted;
		}

		&__answer {
			font-weight: bold;
		}
	}

	.ml-occlusion-image {
		position: relative;
		width: 100%;

		&__img {
			display: block;
			width: 100%;
		}

		&--sized &__img {
			height: 100%;
			object-fit: fill;
		}
	}

	.ml-occlusion-mask {
		position: absolute;
		margin: 0;
		padding: 0;
		background: transparent;
		border: 1px dashed $background-modifier-border;
		border-radius: $radius-sm;
		cursor: pointer;

		&:hover:not(:disabled),
		&:focus-visible {
			border-color: $interactive-accent;
		}

		&--revealed {
			border-style: solid;
			background: rgba($interactive-accent, 0.2);
		}

		&--missed {
			border-color: $text-error;
			background: rgba($text-error, 0.2);
		}

		&__answer {
			font-size: 0.7rem;
			color: $text-normal;
			position: absolute;
			inset: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			text-align: center;
			overflow: hidden;
		}
	}

	.ml-occlusion-missing {
		display: flex;
		flex-direction: column;
		gap: $spacing-xxs;
		align-items: center;
		justify-content: center;
		min-height: 120px;
		border: 1px dashed $background-modifier-border;
		border-radius: $radius-sm;
		color: $text-muted;

		&__title {
			font-weight: bold;
		}

		&__reference {
			font-style: italic;
		}
	}

	.ml-occlusion-reveal-all {
		align-self: flex-start;
		font-size: 0.8rem;
	}
</style>
