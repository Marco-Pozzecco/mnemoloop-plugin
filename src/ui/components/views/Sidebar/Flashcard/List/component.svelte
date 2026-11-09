<script lang="ts">
	import type { FlashcardMetadata } from '@/schemas';
	import type SidebarFlashcardListProps from './types';
	import { SidebarFlashcardCard } from '@/ui/components';

	let { cards, previews, hrefFor, onOpen, className = '' }: SidebarFlashcardListProps = $props();

	function handleClick(event: MouseEvent, card: FlashcardMetadata): void {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}
		event.preventDefault();
		onOpen(card);
	}
</script>

<div class="ml-sidebar-flashcard__list {className}">
	{#each cards as card (card.uuid)}
		<a
			class="ml-sidebar-flashcard__wrapper"
			href={hrefFor(card)}
			onclick={(event) => handleClick(event, card)}
		>
			<SidebarFlashcardCard {card} preview={previews[card.file]} />
		</a>
	{/each}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-sidebar-flashcard__list {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
	}

	.ml-sidebar-flashcard__wrapper {
		text-decoration: none;
	}
</style>
