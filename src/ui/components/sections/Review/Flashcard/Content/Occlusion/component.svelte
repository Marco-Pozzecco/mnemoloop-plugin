<script lang="ts">
	import { type FlashcardOcclusionContent, type FlashcardOcclusionMask } from '@/schemas';
	import { type MarkdownOptions, renderMarkdown } from '@/ui/actions/markdown';
	import { Icon } from '@/ui/components';
	import { getAppContext } from '@/ui/context/AppContext';
	import type { FlashcardContentProps } from '../types';
	import { fisherYatesShuffle } from '../utils';
	import { hitTestMasks } from './utils';
	import type { OcclusionMaskStatus } from './types';

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

	let containerRef = $state<HTMLDivElement>();
	let imageRef = $state<HTMLDivElement>();
	let shuffledMasks = $state<FlashcardOcclusionMask[]>([]);
	let promptIndex = $state(0);
	let isComplete = $state(false);
	let lastContentKey = $state('');
	let lastHintKey = $state('');
	let revealedIds = $state<string[]>([]);
	let missedIds = $state<string[]>([]);
	let wrongIds = $state<string[]>([]);
	let isHintShowing = $state(false);
	let missFeedback = $state<{ selected: string; prompted: string } | null>(null);

	const currentPrompt = $derived(shuffledMasks[promptIndex] ?? null);
	const hasDimensions = $derived(!!content?.width && !!content?.height);
	const imageFile = $derived(
		content ? app.metadataCache.getFirstLinkpathDest(content.image, sourcePath) : null,
	);
	const imageUrl = $derived(imageFile ? app.vault.getResourcePath(imageFile) : null);
	const outcomeCorrect = $derived(isComplete && missedIds.length === 0);
	const foundCount = $derived(revealedIds.length);
	const hintOptions: MarkdownOptions = $derived({
		content: currentPrompt?.hint ?? '',
		sourcePath,
	});

	/** One entry per prompt, in the order it was asked. */
	const promptResults = $derived(
		shuffledMasks.map((mask, index) => ({
			mask,
			status:
				index < promptIndex || isComplete
					? missedIds.includes(mask.id)
						? ('missed' as const)
						: ('correct' as const)
					: index === promptIndex
						? ('current' as const)
						: ('pending' as const),
		})),
	);

	$effect(() => {
		const key = content ? JSON.stringify(content) : '';
		if (key === lastContentKey) return;
		lastContentKey = key;

		revealedIds = [];
		missedIds = [];
		wrongIds = [];
		missFeedback = null;
		isComplete = false;
		isHintShowing = false;
		promptIndex = 0;
		shuffledMasks = content ? fisherYatesShuffle(content.masks) : [];
	});

	$effect(() => {
		onSetAnswerCorrectness?.(outcomeCorrect);
	});

	$effect(() => {
		const key = `${currentPrompt?.id ?? ''}:${isAnswerShowing ? 'answer' : 'question'}:${isComplete ? 'done' : 'live'}`;
		if (key === lastHintKey) return;
		lastHintKey = key;
		isHintShowing = false;
	});

	function maskStatus(id: string): OcclusionMaskStatus {
		if (isComplete) return missedIds.includes(id) ? 'missed' : 'correct';
		if (wrongIds.includes(id)) return 'wrong';
		if (missedIds.includes(id)) return 'asked';
		if (revealedIds.includes(id)) return 'correct';
		return 'hidden';
	}

	function maskLabel(mask: FlashcardOcclusionMask, status: OcclusionMaskStatus): string {
		return status === 'asked' ? `${mask.answer} · asked` : mask.answer;
	}

	/** An asked region is also a miss; keep both classes for styling and tests. */
	function maskClass(status: OcclusionMaskStatus): string {
		return status === 'asked'
			? 'ml-occlusion-mask ml-occlusion-mask--asked ml-occlusion-mask--missed'
			: `ml-occlusion-mask ml-occlusion-mask--${status}`;
	}

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
			wrongIds = [...wrongIds, mask.id];
			missFeedback = { selected: mask.answer, prompted: prompted.answer };
		} else {
			missFeedback = null;
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
		isHintShowing = false;
		missFeedback = null;
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

	function toggleHint(): void {
		if (isComplete || isAnswerShowing || !currentPrompt?.hint) return;
		isHintShowing = !isHintShowing;
	}

	function keepHintButtonUnfocused(event: FocusEvent): void {
		(event.currentTarget as HTMLButtonElement).blur();
	}

	function handleWindowKeyDown(event: KeyboardEvent): void {
		if (!containerRef || containerRef.offsetParent === null) return;
		if (
			event.target instanceof Element &&
			event.target.closest('button, a, input, textarea, select, [contenteditable="true"]')
		) {
			return;
		}
		if (
			(event.key === 'h' || event.key === 'H') &&
			!event.ctrlKey &&
			!event.altKey &&
			!event.metaKey &&
			!event.isComposing &&
			!isComplete &&
			!isAnswerShowing &&
			currentPrompt?.hint
		) {
			event.preventDefault();
			toggleHint();
		}
	}
</script>

<svelte:window onkeydown={handleWindowKeyDown} />

{#if content}
	<div bind:this={containerRef} class="ml-occlusion-content">
		{#if !isComplete}
			<div class="ml-occlusion-header">
				<div class="ml-occlusion-header__main" role="status" aria-live="polite">
					<div class="ml-occlusion-header__eyebrow">
						Prompt <b>{promptIndex + 1}</b> of {shuffledMasks.length}
					</div>
					<div class="ml-occlusion-header__question">
						Select the <b>{currentPrompt?.answer}</b>
					</div>
				</div>
				<div class="ml-occlusion-header__side">
					<div class="ml-occlusion-segments" aria-hidden="true">
						{#each promptResults as result (result.mask.id)}
							<span class="ml-occlusion-segment ml-occlusion-segment--{result.status}"></span>
						{/each}
					</div>
					{#if currentPrompt?.hint}
						<button
							type="button"
							class="ml-occlusion-hint__button"
							tabindex="-1"
							aria-expanded={isHintShowing}
							aria-keyshortcuts="H"
							onclick={toggleHint}
							onfocus={keepHintButtonUnfocused}
						>
							<Icon name="lightbulb" size={16} />
							<span class="ml-occlusion-hint__label">
								{isHintShowing ? 'Hide hint' : 'Show hint'}
							</span>
							<kbd class="ml-occlusion-hint__key">H</kbd>
						</button>
					{/if}
				</div>
			</div>

			{#if isHintShowing && currentPrompt?.hint}
				<div class="ml-occlusion-hint" role="region" aria-label="Hint">
					<div class="ml-occlusion-hint__header">Hint</div>
					<div class="ml-occlusion-hint__body" use:renderMarkdown={hintOptions}></div>
				</div>
			{/if}
		{/if}

		<div class="ml-occlusion-stage">
			<div
				bind:this={imageRef}
				class="ml-occlusion-stage__inner"
				class:ml-occlusion-stage__inner--sized={hasDimensions}
				style={hasDimensions ? `aspect-ratio: ${content.width} / ${content.height}` : ''}
			>
				{#if imageUrl}
					<img class="ml-occlusion-stage__img" src={imageUrl} alt={content.image} />
				{:else}
					<div class="ml-occlusion-missing" role="alert">
						<p class="ml-occlusion-missing__title">Image not found</p>
						<p class="ml-occlusion-missing__reference">{content.image}</p>
					</div>
				{/if}

				{#each content?.masks ?? [] as mask (mask.id)}
					{@const status = maskStatus(mask.id)}
					<button
						type="button"
						class={maskClass(status)}
						style={maskStyle(mask)}
						aria-label={mask.answer}
						aria-pressed={status !== 'hidden'}
						disabled={isComplete}
						onclick={(event) => handleRegionClick(event, mask)}
						onkeydown={(event) => handleRegionKeyDown(event, mask)}
					>
						{#if status !== 'hidden'}
							<span class="ml-occlusion-mask__answer">{maskLabel(mask, status)}</span>
						{/if}
						{#if status === 'correct' && !isComplete}
							<span class="ml-occlusion-mask__badge ml-occlusion-mask__badge--ok">✓</span>
						{/if}
						{#if status === 'wrong'}
							<span class="ml-occlusion-mask__badge ml-occlusion-mask__badge--miss">✕</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		{#if missFeedback && !isComplete}
			<div class="ml-occlusion-feedback" role="status">
				<b>Not quite.</b>
				<span>
					You selected {missFeedback.selected}. The <b>{missFeedback.prompted}</b> region is
					highlighted.
				</span>
			</div>
		{/if}

		{#if !isComplete}
			<div class="ml-occlusion-actions">
				<button type="button" class="ml-occlusion-reveal" onclick={revealAll}>
					Reveal remaining regions
				</button>
				<span class="ml-occlusion-found">{foundCount} of {shuffledMasks.length} found</span>
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use 'tokens' as *;
	@use 'breakpoints' as *;

	.ml-occlusion-content {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
	}

	/* --- Prompt header --- */

	.ml-occlusion-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: $spacing-md;
	}

	.ml-occlusion-header__main {
		min-width: 0;
	}

	.ml-occlusion-header__eyebrow {
		margin-bottom: 2px;
		color: $text-muted;
		font-size: $font-xs;

		b {
			color: $text-normal;
			font-weight: $font-semibold;
		}
	}

	.ml-occlusion-header__question {
		color: $text-normal;
		font-size: 1.15rem;
		font-weight: $font-semibold;
		line-height: 1.35;

		b {
			color: $text-accent;
		}
	}

	.ml-occlusion-header__side {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: $spacing-xs;
		flex: 0 0 auto;
	}

	.ml-occlusion-segments {
		display: flex;
		gap: 4px;
		width: 11rem;
		max-width: 100%;
	}

	.ml-occlusion-segment {
		height: 6px;
		flex: 1;
		border-radius: 999px;
		background: $background-modifier-border;
	}

	.ml-occlusion-segment--correct {
		background: $status-success;
	}

	.ml-occlusion-segment--missed {
		background: $text-error;
	}

	.ml-occlusion-segment--current {
		background: $interactive-accent;
		box-shadow: 0 0 0 3px color-mix(in srgb, $interactive-accent 20%, transparent);
	}

	/* --- Hint disclosure --- */

	.ml-occlusion-hint__button {
		display: inline-flex;
		align-items: center;
		gap: $spacing-xs;
		min-height: 2rem;
		padding: 0 $spacing-sm;
		border: $border-width solid $background-modifier-border;
		border-radius: $radius-md;
		background: $background-secondary;
		color: $text-normal;
		font: inherit;
		font-size: $font-xs;
		cursor: pointer;

		&:hover {
			border-color: $background-modifier-border-hover;
		}

		&:focus-visible {
			outline: 2px solid $interactive-accent;
			outline-offset: 2px;
		}
	}

	.ml-occlusion-hint__label {
		font-weight: $font-medium;
	}

	.ml-occlusion-hint__key {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 $spacing-xxs;
		border: $border-width solid $background-modifier-border;
		border-radius: $radius-xs;
		background: $background-primary-alt;
		color: $text-muted;
		font-family: $font-monospace;
		font-size: $font-xs;
		line-height: 1;
	}

	.ml-occlusion-hint {
		width: 100%;
		border: $border-width solid $background-modifier-border;
		border-inline-start-color: $interactive-accent;
		border-radius: $radius-md;
		background: $background-secondary;
		overflow: hidden;
	}

	.ml-occlusion-hint__header {
		padding: $spacing-xs $spacing-md 0;
		color: $text-muted;
		font-size: $font-xs;
		font-weight: $font-medium;
	}

	.ml-occlusion-hint__body {
		padding: $spacing-xs $spacing-md $spacing-sm;
		color: $text-normal;
		line-height: $line-height-normal;
	}

	/* --- Image stage --- */

	.ml-occlusion-stage {
		position: relative;
		width: 100%;
		border-radius: $radius-sm;
		overflow: hidden;
		background: $background-secondary;
	}

	.ml-occlusion-stage__inner {
		position: relative;
		width: 100%;
	}

	.ml-occlusion-stage__img {
		display: block;
		width: 100%;
	}

	.ml-occlusion-stage__inner--sized .ml-occlusion-stage__img {
		height: 100%;
		object-fit: fill;
	}

	/* --- Regions --- */

	.ml-occlusion-mask {
		position: absolute;
		margin: 0;
		padding: 0;
		// An unrevealed region hides the image beneath it, so its answer cannot
		// be read off the image. The theme background reads as a cut-out.
		background: $background-primary;
		border: $border-width solid $background-modifier-border-hover;
		border-radius: $radius-sm;
		cursor: pointer;
		z-index: 1;
		transition:
			border-color $transition-fast,
			background $transition-fast;

		&:hover:not(:disabled),
		&:focus-visible {
			border-color: $interactive-accent;
			z-index: 3;
		}

		// Hidden regions are marked as such rather than reading as blank boxes.
		&--hidden::after {
			content: '?';
			position: absolute;
			inset: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			color: $text-faint;
			font-size: $font-xs;
			font-weight: $font-bold;
			opacity: 0.6;
			pointer-events: none;
		}

		&--correct {
			border: 2px solid $interactive-accent;
			background: color-mix(in srgb, $interactive-accent 20%, transparent);
			z-index: 2;
		}

		&--wrong {
			border: 2px solid $text-error;
			background: color-mix(in srgb, $text-error 20%, transparent);
			z-index: 2;
		}

		&--missed {
			border: 2px solid $text-error;
			background: color-mix(in srgb, $text-error 20%, transparent);
			z-index: 2;
		}

		&--asked {
			border: 2px dashed $text-error;
			background: color-mix(in srgb, $text-error 20%, transparent);
			z-index: 2;
		}
	}

	.ml-occlusion-mask__answer {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		max-width: none;
		padding: 2px 6px;
		border: $border-width solid $background-modifier-border-hover;
		border-radius: $radius-sm;
		background: color-mix(in srgb, $background-primary 88%, transparent);
		color: $text-normal;
		font-size: 0.7rem;
		line-height: 1.2;
		white-space: nowrap;
		pointer-events: none;
	}

	.ml-occlusion-mask__badge {
		position: absolute;
		top: -8px;
		right: -8px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: $background-primary;
		border: 1.5px solid;
		font-size: 11px;
		font-weight: $font-bold;
	}

	.ml-occlusion-mask__badge--ok {
		border-color: $status-success;
		color: $status-success;
	}

	.ml-occlusion-mask__badge--miss {
		border-color: $text-error;
		color: $text-error;
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

	/* --- Actions --- */

	.ml-occlusion-feedback {
		display: flex;
		gap: $spacing-xs;
		align-items: baseline;
		padding: $spacing-xs $spacing-sm;
		border: $border-width solid color-mix(in srgb, $text-error 40%, transparent);
		border-radius: $radius-sm;
		background: color-mix(in srgb, $text-error 12%, transparent);
		color: $text-error;
		font-size: $font-xs;

		b {
			color: $text-error;
			font-weight: $font-bold;
		}
	}

	.ml-occlusion-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: $spacing-sm;
		color: $text-muted;
		font-size: $font-xs;
	}

	.ml-occlusion-reveal {
		padding: 0;
		border: none;
		background: none;
		color: $text-muted;
		font: inherit;
		font-size: $font-xs;
		text-decoration: underline dotted;
		text-underline-offset: 3px;
		cursor: pointer;

		&:hover {
			color: $text-accent;
		}
	}

	@media (max-width: $mobile-breakpoint) {
		.ml-occlusion-header {
			flex-direction: column;
			gap: $spacing-xs;
		}

		.ml-occlusion-header__question {
			font-size: 1rem;
		}

		.ml-occlusion-header__side {
			width: 100%;
			align-items: stretch;
		}

		.ml-occlusion-segments {
			width: 100%;
		}

		.ml-occlusion-hint__button {
			width: 100%;
			justify-content: center;
		}

		.ml-occlusion-hint__key {
			display: none;
		}
	}
</style>
