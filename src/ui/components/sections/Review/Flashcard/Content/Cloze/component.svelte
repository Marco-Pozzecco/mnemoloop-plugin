<script lang="ts">
	import { type FlashcardClozeContent } from '@/schemas';
	import { type MarkdownOptions, renderMarkdown } from '@/ui/actions/markdown';
	import { Button, Icon } from '@/ui/components/elements';
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
		if (id !== highlightedId || isAnswerShowing) return;
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

		<Button
			variant="ghost"
			class="ml-cloze-hint__button"
			disabled={isAnswerShowing || !highlightedCloze?.hint}
			onclick={toggleHint}
		>
			{#snippet icon()}
				<Icon name="lightbulb" size={18} />
			{/snippet}
			Show hint
		</Button>

		{#if isHintShowing && highlightedCloze?.hint && !isAnswerShowing}
			<div class="ml-cloze-hint" use:renderMarkdown={hintOptions}></div>
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

	:global(.ml-cloze-hint__button) {
		display: inline-flex;
		margin-top: $spacing-sm;
	}

	.ml-cloze-hint {
		min-width: 0;
		margin-top: $spacing-xs;
		padding: $spacing-sm $spacing-md;
		border-left: 2px solid $interactive-accent;
		background: $background-secondary;
		border-radius: $radius-sm;
	}

	@media (max-width: $tablet-breakpoint) {
		.ml-cloze-content {
			.ml-cloze-text {
				font-size: 1rem;
			}
		}

		:global(.ml-cloze-hint__button) {
			width: 100%;
		}
	}
</style>
