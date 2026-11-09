<script lang="ts">
	import type { Flashcard, FlashcardMetadata } from '@/schemas';
	import type { FlashcardFormSavePayload } from '@/ui/components/compositions/FlashcardForm/types';
	import {
		ManageFilterBar,
		ManageFlashcardFormSheet,
		ManageHeader,
		ManagePagination,
		ManageResults,
	} from '@/ui/components/sections';
	import { ManageController } from '@/ui/controllers/ManageController';
	import { getAppContext } from '@/ui/context/AppContext';
	import { EMPTY_MANAGE_FILTERS, manageStore } from '@/ui/store/manage.store';
	import type { ManageFilters } from '@/ui/store/manage.store';
	import { Notice } from 'obsidian';
	import { onDestroy, onMount } from 'svelte';
	import type ManageProps from './types';
	import { MANAGE_PAGE_SIZE, cardHref, filterFlashcards, paginate } from './utils';

	let { className }: ManageProps = $props();
	const { app } = getAppContext();
	const vaultName = app.vault.getName();

	const controller = new ManageController();
	const storeRef = manageStore.store;
	const storeState = $derived($storeRef);

	// --- Sheet state ---
	/** Which sheet is open: the editor for an existing row, or a new card. */
	let sheetMode = $state<'create' | 'edit' | null>(null);
	/** The row whose sheet is open or opening; drives the selected marker. */
	let selectedUuid = $state<string | null>(null);
	/** Metadata for the open row; the label and delete path need its file path. */
	let selectedCard = $state<FlashcardMetadata | null>(null);
	/** The loaded card, including content. The edit sheet renders only once this lands. */
	let editingCard = $state<Flashcard | null>(null);
	/** Guards against an older fetch landing after a newer row was clicked. */
	let openRequest = 0;

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

	function handleResetFilters(): void {
		manageStore.setFilters({ ...EMPTY_MANAGE_FILTERS });
	}

	// --- Sheet handlers ---
	async function handleOpen(card: FlashcardMetadata): Promise<void> {
		const request = ++openRequest;
		sheetMode = 'edit';
		selectedUuid = card.uuid;
		selectedCard = card;
		const full = await controller.fetchCard(card.file);
		if (request !== openRequest) return;

		if (!full) {
			selectedUuid = null;
			selectedCard = null;
			sheetMode = null;
			new Notice('Couldn’t open that flashcard.');
			return;
		}
		editingCard = full;
	}

	function handleCloseSheet(): void {
		openRequest++;
		editingCard = null;
		selectedCard = null;
		selectedUuid = null;
		sheetMode = null;
	}

	async function handleSave(payload: FlashcardFormSavePayload): Promise<boolean> {
		let saved = false;

		if (sheetMode === 'create') {
			saved = await controller.createCard({
				content: payload.content,
				decks: payload.decks,
				source: payload.source,
			});
		} else if (editingCard) {
			saved = await controller.updateCard(editingCard, {
				content: payload.content,
				decks: payload.decks,
				source: payload.source,
				status: payload.status ?? editingCard.status,
			});
		}

		if (saved) handleCloseSheet();
		return saved;
	}

	function handleDelete(): void {
		if (selectedCard) controller.deleteCard(selectedCard);
		handleCloseSheet();
	}

	function hrefFor(card: FlashcardMetadata): string {
		return cardHref(vaultName, card.file);
	}

	function handleAdd(): void {
		openRequest++;
		editingCard = null;
		selectedCard = null;
		selectedUuid = null;
		sheetMode = 'create';
	}
</script>

<div class="ml-manage {className ?? ''}">
	<div class="ml-manage__scroll">
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
			onReset={handleResetFilters}
		/>

		<!-- Results -->
		<ManageResults
			isLoading={storeState.isLoading}
			totalCount={storeState.flashcards.length}
			visibleCount={filtered.length}
			cards={visibleCards}
			previews={storeState.previews}
			{hrefFor}
			{selectedUuid}
			onOpen={(card) => void handleOpen(card)}
			onAdd={handleAdd}
			onReset={handleResetFilters}
		/>

		{#if filtered.length > 0}
			<!-- Pagination -->
			<ManagePagination
				currentPage={paged.safePage}
				totalPages={paged.totalPages}
				totalItems={filtered.length}
				pageSize={MANAGE_PAGE_SIZE}
				onPageChange={(page) => manageStore.setCurrentPage(page)}
			/>
		{/if}
	</div>

	{#if sheetMode === 'create'}
		<ManageFlashcardFormSheet
			mode="create"
			{deckOptions}
			onClose={handleCloseSheet}
			onSave={handleSave}
		/>
	{:else if sheetMode === 'edit' && editingCard}
		{#key editingCard.uuid}
			<ManageFlashcardFormSheet
				mode="edit"
				card={editingCard}
				label={(selectedCard ? storeState.previews[selectedCard.file] : undefined) ??
					'this flashcard'}
				{deckOptions}
				onClose={handleCloseSheet}
				onSave={handleSave}
				onDelete={handleDelete}
			/>
		{/key}
	{/if}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-manage {
		position: relative;
		display: flex;
		min-height: 0;
		height: 100%;
	}

	.ml-manage__scroll {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
		gap: $spacing-sm;
		padding: $spacing-lg;
		overflow-y: auto;
	}
</style>
