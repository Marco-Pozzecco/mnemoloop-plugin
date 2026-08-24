<script lang="ts">
	import { type FlashcardClozeContent } from '@/schemas';
	import { type MarkdownOptions, renderMarkdown } from '@/ui/actions/markdown';
	import { Platform } from 'obsidian';
	import { Icon } from '@/ui/components/elements';
	import { SvelteSet } from 'svelte/reactivity';
	import type { FlashcardContentProps } from '../types';
	import { fisherYatesShuffle } from '../utils';
	import { buildClozeMarkdown } from './utils';

	let {
		content,
		sourcePath,
		isAnswerShowing,
		onAllRevealed,
		onShowAnswer,
	}: FlashcardContentProps<FlashcardClozeContent> = $props();

	let isMobile = $state(Platform.isMobile);
	let revealedIds: SvelteSet<string> = new SvelteSet();
	let highlightedId: string | null = $state(null);
	let shuffledOrder: string[] = $state([]);
	let containerRef: HTMLDivElement;
	let isHintShowing = $state(false);
	let lastContentKey = $state('');
	let lastHintKey = $state('');

	const bodyOptions: MarkdownOptions = $derived({
		content: content
			? buildClozeMarkdown(content, revealedIds, isAnswerShowing, highlightedId)
			: '',
		sourcePath,
	});

	const highlightedCloze = $derived(
		content?.deletions.find((deletion) => deletion.id === highlightedId) ?? null,
	);

	const hintOptions: MarkdownOptions = $derived({
		content: highlightedCloze?.hint ?? '',
		sourcePath,
	});

	$effect(() => {
		const currentKey = content ? JSON.stringify(content) : '';
		if (currentKey === lastContentKey) return;
		lastContentKey = currentKey;
		if (content) {
			initOrder();
		} else {
			revealedIds = new SvelteSet();
			shuffledOrder = [];
			highlightedId = null;
		}
	});

	$effect(() => {
		const currentHintKey = `${highlightedId ?? ''}:${isAnswerShowing ? 'answer' : 'question'}`;
		if (currentHintKey === lastHintKey) return;
		lastHintKey = currentHintKey;
		isHintShowing = false;
	});

	function initOrder() {
		if (!content) return;
		shuffledOrder = fisherYatesShuffle(content.deletions.map((deletion) => deletion.id));
		revealedIds = new SvelteSet();
		highlightedId = shuffledOrder[0] ?? null;
	}

	function getNextHighlighted(): string | null {
		for (const id of shuffledOrder) {
			if (!revealedIds.has(id)) return id;
		}
		return null;
	}

	function revealCloze(id: string) {
		if (isAnswerShowing || id !== highlightedId || revealedIds.has(id)) return;
		const newRevealed = new SvelteSet(revealedIds);
		newRevealed.add(id);
		revealedIds = newRevealed;
		const next = getNextHighlighted();
		highlightedId = next;
		if (!next) {
			onAllRevealed?.();
			onShowAnswer?.();
		}
	}

	function getPlaceholderId(target: EventTarget | null): string | null {
		if (!(target instanceof Element)) return null;
		const placeholder = target.closest<HTMLElement>('.ml-cloze-placeholder');
		if (!placeholder || !containerRef?.contains(placeholder)) return null;
		return placeholder.dataset.clozeId ?? null;
	}

	function handleClozeClick(event: MouseEvent) {
		const id = getPlaceholderId(event.target);
		if (id !== highlightedId || isAnswerShowing || !id) return;
		event.preventDefault();
		revealCloze(id);
	}

	function handleClozeKeyDown(event: KeyboardEvent) {
		const id = getPlaceholderId(event.target);
		if (
			id === null ||
			id !== highlightedId ||
			isAnswerShowing ||
			(event.key !== 'Enter' && event.key !== ' ' && event.code !== 'Space')
		) {
			return;
		}
		event.preventDefault();
		revealCloze(id);
	}

	function handleWindowKeyDown(event: KeyboardEvent) {
		if (!containerRef || containerRef.offsetParent === null) return;
		if (getPlaceholderId(event.target)) return;
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
			!isAnswerShowing &&
			highlightedCloze?.hint
		) {
			event.preventDefault();
			toggleHint();
			return;
		}
		if (event.code === 'Space' && highlightedId) {
			event.preventDefault();
			revealCloze(highlightedId);
		}
	}

	function clozeInteractions(node: HTMLElement): { destroy: () => void } {
		node.addEventListener('click', handleClozeClick);
		node.addEventListener('keydown', handleClozeKeyDown);

		return {
			destroy() {
				node.removeEventListener('click', handleClozeClick);
				node.removeEventListener('keydown', handleClozeKeyDown);
			},
		};
	}

	function toggleHint() {
		if (isAnswerShowing || !highlightedCloze?.hint) return;
		isHintShowing = !isHintShowing;
	}

	function keepHintButtonUnfocused(event: FocusEvent): void {
		(event.currentTarget as HTMLButtonElement).blur();
	}
</script>

<svelte:window onkeydown={handleWindowKeyDown} />

<div bind:this={containerRef} class="ml-cloze-content">
	{#if content}
		<div
			class="ml-cloze-text"
			role="group"
			aria-label="Cloze content"
			use:clozeInteractions
			use:renderMarkdown={bodyOptions}
		></div>

		{#if highlightedCloze?.hint && !isAnswerShowing}
			<div class="ml-cloze-hint__disclosure">
				<button
					type="button"
					class="ml-cloze-hint__button"
					tabindex="-1"
					aria-expanded={isHintShowing}
					aria-keyshortcuts="H"
					onclick={toggleHint}
					onfocus={keepHintButtonUnfocused}
				>
					<Icon name="lightbulb" size={18} />
					<span class="ml-cloze-hint__label">{isHintShowing ? 'Hide hint' : 'Show hint'}</span>
					{#if !isMobile}
						<kbd class="ml-cloze-hint__key">H</kbd>
					{/if}
				</button>

				{#if isHintShowing}
					<div class="ml-cloze-hint" role="region" aria-label="Hint">
						<div class="ml-cloze-hint__header">Hint</div>
						<div class="ml-cloze-hint__body" use:renderMarkdown={hintOptions}></div>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style lang="scss">
	@use 'tokens' as *;
	@use 'breakpoints' as *;

	.ml-cloze-content {
		width: 100%;
		position: relative;
	}

	.ml-cloze-text {
		line-height: 1.8;
		font-size: 1.1rem;
		word-break: break-word;
	}

	.ml-cloze-text :global(.ml-cloze-placeholder) {
		display: inline-block;
		background-color: $background-secondary;
		color: $text-muted;
		padding: 0 4px;
		border-radius: 3px;
		cursor: default;
	}

	.ml-cloze-text :global(.ml-cloze-placeholder-active) {
		background-color: $interactive-accent;
		color: $text-accent-foreground;
		cursor: pointer;
		font-weight: bold;
	}

	.ml-cloze-hint__disclosure {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: $spacing-xs;
		margin-top: $spacing-sm;
		width: 100%;
	}

	.ml-cloze-hint__button {
		display: inline-flex;
		align-items: center;
		gap: $spacing-xs;
		min-height: 44px;
		padding: 0 $spacing-sm;
		border: $border-width solid $background-modifier-border;
		border-radius: $radius-md;
		background: $background-secondary;
		color: $text-normal;
		font: inherit;
		font-size: $font-sm;
		font-weight: $font-medium;
		line-height: 1;
		cursor: pointer;
		user-select: none;
		transition:
			background-color $transition-fast,
			border-color $transition-fast,
			color $transition-fast,
			transform $transition-fast,
			box-shadow $transition-fast;

		&[aria-expanded='true'] {
			border-color: $interactive-accent;
		}

		&:active {
			transform: scale(0.98);
		}

		&:focus-visible {
			outline: 2px solid $interactive-accent;
			outline-offset: 2px;
		}

		@media (hover: hover) and (pointer: fine) {
			&:hover {
				border-color: $background-modifier-border-hover;
				box-shadow: $shadow-sm;
				transform: translateY(-1px);
			}
		}
	}

	:global(.ml-cloze-hint__button .ml-icon) {
		color: $text-muted;
	}

	.ml-cloze-hint__label {
		font-weight: $font-medium;
	}

	.ml-cloze-hint__key {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.5rem;
		height: 1.5rem;
		margin-left: auto;
		padding: 0 $spacing-xxs;
		border: $border-width solid $background-modifier-border;
		border-radius: $radius-xs;
		background: $background-primary-alt;
		color: $text-muted;
		font-family: $font-monospace;
		font-size: $font-xs;
		font-weight: $font-medium;
		line-height: 1;
	}

	.ml-cloze-hint {
		min-width: 0;
		width: 100%;
		border: $border-width solid $background-modifier-border;
		border-inline-start-color: $interactive-accent;
		border-radius: $radius-md;
		background: $background-secondary;
		overflow: hidden;
	}

	.ml-cloze-hint__header {
		padding: $spacing-xs $spacing-md 0;
		color: $text-muted;
		font-size: $font-xs;
		font-weight: $font-medium;
	}

	.ml-cloze-hint__body {
		padding: $spacing-xs $spacing-md $spacing-sm;
		color: $text-normal;
		line-height: $line-height-normal;
	}

	@media (max-width: $tablet-breakpoint) {
		.ml-cloze-content {
			.ml-cloze-text {
				font-size: 1rem;
			}
		}

		.ml-cloze-hint__button {
			width: 100%;
		}
	}
</style>
