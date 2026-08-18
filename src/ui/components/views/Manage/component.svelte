<script lang="ts">
	import { CardStatus } from '@/schemas';
	import type { FlashcardMetadata } from '@/schemas';
	import {
		ManageFilterBar,
		ManageHeader,
		ManagePagination,
		ManageResults,
	} from '@/ui/components/sections';
	import { ManageController } from '@/ui/controllers/ManageController';
	import { getAppContext } from '@/ui/context/AppContext';
	import { modalStore, ModalViewEnum } from '@/ui/store/modal.store';
	import { manageStore } from '@/ui/store/manage.store';
	import type { ManageFilters } from '@/ui/store/manage.store';
	import { SvelteModal } from '@/ui/views/Modal/ModalView';
	import { ModalClassNames } from '@/ui/views/Modal/types';
	import { onDestroy, onMount } from 'svelte';
	import type ManageProps from './types';
	import { MANAGE_PAGE_SIZE, filterFlashcards, paginate } from './utils';

	let { className }: ManageProps = $props();
	const { app } = getAppContext();

	const controller = new ManageController();
	const storeRef = manageStore.store;
	const storeState = $derived($storeRef);

	// --- Derived table data ---
	const filtered = $derived(filterFlashcards(storeState.flashcards, storeState.filters));
	const paged = $derived(paginate(filtered, storeState.currentPage, MANAGE_PAGE_SIZE));
	const visibleCards = $derived(paged.pageItems);

	// Unique decks across all cards, for the deck filter dropdown and deck picker options.
	const deckOptions = $derived(
		Array.from(new Set(storeState.flashcards.flatMap((card) => card.decks))).sort(),
	);

	// --- Lifecycle ---
	onMount(() => {
		void controller.init();
	});

	onDestroy(() => {
		controller.dispose();
	});

	// --- Effects ---
	// Clamp the current page when the filtered result set shrinks (e.g. after a delete).
	$effect(() => {
		if (paged.safePage !== storeState.currentPage) {
			manageStore.setCurrentPage(paged.safePage);
		}
	});

	// Request content previews for the rows visible on the current page.
	$effect(() => {
		controller.ensurePreviews(visibleCards);
	});

	// --- Filter handlers ---
	function handleFilterChange(patch: Partial<ManageFilters>): void {
		manageStore.setFilters({ ...storeState.filters, ...patch });
	}

	function handleStatusChange(card: FlashcardMetadata, value: string): void {
		controller.updateStatus(card, value as CardStatus);
	}

	// --- Inline deck editing: each picker selection commits immediately ---
	function addDeckToCard(card: FlashcardMetadata, deck: string): void {
		const normalized = deck.trim();
		if (!normalized) return;
		const current = storeState.flashcards.find((c) => c.uuid === card.uuid) ?? card;
		if (current.decks.some((d) => d.toLowerCase() === normalized.toLowerCase())) return;
		controller.updateDecks(current, [...current.decks, normalized]);
	}

	function removeDeckFromCard(card: FlashcardMetadata, deck: string): void {
		const current = storeState.flashcards.find((c) => c.uuid === card.uuid) ?? card;
		const next = current.decks.filter((d) => d.toLowerCase() !== deck.toLowerCase());
		if (next.length === current.decks.length) return;
		controller.updateDecks(current, next);
	}

	// --- Row actions ---
	async function handleEdit(card: FlashcardMetadata): Promise<void> {
		const fullCard = await controller.fetchCard(card.file);
		if (!fullCard) return;
		modalStore.open(ModalViewEnum.flashcard, { mode: 'edit', card: fullCard });
		new SvelteModal(app, ModalClassNames.flashcard).open();
	}

	function handleDelete(card: FlashcardMetadata): void {
		controller.deleteCard(card);
	}

	function handleAdd(): void {
		modalStore.open(ModalViewEnum.flashcard, { mode: 'create' });
		new SvelteModal(app, ModalClassNames.flashcard).open();
	}
</script>

<div class="ml-manage {className ?? ''}">
	<!-- Header: title + add -->
	<ManageHeader
		totalCount={storeState.flashcards.length}
		visibleCount={filtered.length}
		onAdd={handleAdd}
	/>

	<!-- Filter bar -->
	<ManageFilterBar
		filters={storeState.filters}
		{deckOptions}
		onChange={handleFilterChange}
		onReset={() => manageStore.setFilters({ type: '', status: '', deck: '' })}
	/>

	<!-- Results -->
	<ManageResults
		isLoading={storeState.isLoading}
		totalCount={storeState.flashcards.length}
		visibleCount={filtered.length}
		cards={visibleCards}
		previews={storeState.previews}
		{deckOptions}
		onAddDeck={addDeckToCard}
		onRemoveDeck={removeDeckFromCard}
		onStatusChange={handleStatusChange}
		onEdit={(card) => void handleEdit(card)}
		onDelete={handleDelete}
		onAdd={handleAdd}
		onReset={() => manageStore.setFilters({ type: '', status: '', deck: '' })}
	/>

	{#if filtered.length > 0}
		<!-- Pagination -->
		<ManagePagination
			currentPage={paged.safePage}
			totalPages={paged.totalPages}
			onPrevious={() => manageStore.setCurrentPage(storeState.currentPage - 1)}
			onNext={() => manageStore.setCurrentPage(storeState.currentPage + 1)}
		/>
	{/if}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-manage {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
		padding: $spacing-lg;
		height: 100%;
		overflow-y: auto;
	}
</style>
