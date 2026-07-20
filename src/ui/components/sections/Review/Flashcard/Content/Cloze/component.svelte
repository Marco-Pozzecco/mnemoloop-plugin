<script lang="ts">
	import { type FlashcardClozeContent } from '@/schemas';
	import { gesture } from '@/ui/actions/gestures';
	import { Button, Icon, Tooltip } from '@/ui/components/elements';
	import { Platform } from 'obsidian';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import type { FlashcardContentProps } from '../types';

	let {
		content,
		isAnswerShowing,
		onAllRevealed,
		onShowAnswer,
	}: FlashcardContentProps<FlashcardClozeContent> = $props();
	let revealedIds: SvelteSet<string> = $state(new SvelteSet());
	let highlightedId: string | null = $state(null);
	let shuffledOrder: string[] = $state([]);
	let containerRef: HTMLDivElement;
	let openTooltips: SvelteSet<string> = $state(new SvelteSet());
	let isTouch = $state(Platform.isMobile);

	function tooltipOpen(id: string, v: boolean) {
		if (v) openTooltips = new SvelteSet([...openTooltips, id]);
		else {
			const n = new SvelteSet(openTooltips);
			n.delete(id);
			openTooltips = n;
		}
	}
	const isOpen = (id: string) => openTooltips.has(id);

	function handleOutsideTap(e: TouchEvent) {
		if (!isTouch || openTooltips.size === 0) return;
		const target = e.target as Node | null;
		if (target && containerRef && !containerRef.contains(target)) {
			openTooltips = new SvelteSet();
		}
	}

	let lastContentKey = $state('');

	$effect(() => {
		if (!content) return;
		const currentKey = JSON.stringify(content.deletions.map((d) => d.id));
		if (currentKey !== lastContentKey) {
			lastContentKey = currentKey;
			initOrder();
		}
	});

	function initOrder() {
		if (!content) return;
		shuffledOrder = fisherYatesShuffle(content.deletions.map((d) => d.id));
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
		if (revealedIds.has(id)) return;
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

	function handleKeyDown(event: KeyboardEvent) {
		if (!containerRef || containerRef.offsetParent === null) return;
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
			return;
		if (event.code === 'Space' && highlightedId) {
			event.preventDefault();
			revealCloze(highlightedId);
		}
	}

	function handleClozeClick(id: string) {
		if (id === highlightedId && !isAnswerShowing) {
			revealCloze(id);
		}
	}

	function fisherYatesShuffle<T>(array: T[]): T[] {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	interface ClozeSegment {
		type: 'text';
		text: string;
	}

	interface ClozePlaceholder {
		type: 'cloze';
		id: string;
		answer: string;
		hint: string | null;
	}

	const segments: Array<ClozeSegment | ClozePlaceholder> = $derived.by(() => {
		if (!content) return [];

		const result: Array<ClozeSegment | ClozePlaceholder> = [];
		const posMap = new SvelteMap<number, FlashcardClozeContent['deletions'][0]>();
		for (const del of content.deletions) {
			for (const pos of del.positions) {
				posMap.set(pos, del);
			}
		}

		const sortedPositions = [...posMap.keys()].sort((a, b) => a - b);
		let cursor = 0;

		for (const pos of sortedPositions) {
			const del = posMap.get(pos)!;
			if (pos > cursor) {
				result.push({ type: 'text', text: content.text.slice(cursor, pos) });
			}
			result.push({ type: 'cloze', id: del.id, answer: del.answer, hint: del.hint });
			cursor = pos;
		}

		if (cursor < content.text.length) {
			result.push({ type: 'text', text: content.text.slice(cursor) });
		}

		return result;
	});

	const highlightedCloze = $derived(
		segments.find((s) => s.type === 'cloze' && s.id === highlightedId) as
			| ClozePlaceholder
			| undefined,
	);
</script>

<svelte:window onkeydown={handleKeyDown} ontouchstart={handleOutsideTap} />

<div bind:this={containerRef} class="ml-cloze-content">
	{#if content}
		<Tooltip.Provider delayDuration={700} disableHoverableContent>
			<p class="ml-cloze-text">
				{#each segments as segment, i (i)}
					{#if segment.type === 'text'}
						{segment.text}
					{:else if isAnswerShowing || revealedIds.has(segment.id)}
						<span class="ml-cloze-revealed">{segment.answer}</span>
					{:else if segment.id === highlightedId}
						<Tooltip.Root bind:open={() => isOpen(segment.id), (v) => tooltipOpen(segment.id, v)}>
							<Tooltip.Trigger disabled={isAnswerShowing}>
								{#snippet child({ props })}
									<span
										{...props}
										class="ml-cloze-highlighted"
										onclick={() => handleClozeClick(segment.id)}
										use:gesture={isTouch
											? { longPressDuration: 300, onLongPress: () => tooltipOpen(segment.id, true) }
											: {}}>[...]</span
									>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Portal>
								{#if segment.hint}
									<Tooltip.Content side="top" sideOffset={6}>
										{segment.hint}
										<Tooltip.Arrow />
									</Tooltip.Content>
								{/if}
							</Tooltip.Portal>
						</Tooltip.Root>
					{:else}
						<span class="ml-cloze-obscured">[...]</span>
					{/if}
				{/each}
			</p>

			<Button
				variant="ghost"
				class="ml-cloze-hint__button"
				disabled={isAnswerShowing || !highlightedCloze?.hint}
				onclick={() => {
					if (!highlightedCloze) return;
					tooltipOpen(highlightedCloze.id, !isOpen(highlightedCloze.id));
				}}
			>
				{#snippet icon()}
					<Icon name="lightbulb" size={18} />
				{/snippet}
				Show hint
			</Button>
		</Tooltip.Provider>
	{/if}
</div>

<style lang="scss">
	@use 'tokens' as *;
	@use 'breakpoints' as *;

	.ml-cloze-content {
		width: 100%;
		position: relative;

		:global .ml-cloze-hint__button {
			display: none;
		}
	}

	.ml-cloze-text {
		line-height: 1.8;
		font-size: 1.1rem;
		white-space: wrap;
		word-break: break-word;
	}

	.ml-cloze-obscured {
		background-color: $background-secondary;
		color: $text-muted;
		padding: 0 4px;
		border-radius: 3px;
		cursor: default;
	}

	.ml-cloze-highlighted {
		background-color: $interactive-accent;
		color: $text-accent-foreground;
		padding: 0 4px;
		border-radius: 3px;
		cursor: pointer;
		font-weight: bold;
	}
	.ml-cloze-revealed {
		color: $text-normal;
		font-weight: bold;
	}

	@media (max-width: $tablet-breakpoint) {
		.ml-cloze-content {
			.ml-cloze-text {
				font-size: 1rem;
			}

			:global .ml-cloze-hint__button {
				display: inline-flex;
				width: 100%;
			}
		}
	}
</style>
