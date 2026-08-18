<script lang="ts">
	import { Chip, Combobox, Icon } from '@/ui/components/elements';
	import { canCreateNew, filterOptions } from '@/ui/components/elements/Combobox/utils';
	import type ManageDeckCellProps from './types';

	let { card, deckOptions, onAddDeck, onRemoveDeck, className }: ManageDeckCellProps = $props();

	let inputEl: HTMLInputElement | null = $state(null);
	let search = $state('');
	let pickerOpen = $state(false);
	let customAnchor = $state<HTMLElement>(null!);

	const optionList = $derived(deckOptions.map((deck) => ({ value: deck, label: deck })));

	const filteredOptions = $derived(filterOptions(optionList, search));

	const trimmedSearch = $derived(search.trim());

	// Offer "Create" only when the typed value is not already an existing deck option or card deck.
	const canCreate = $derived(
		canCreateNew(optionList, search) &&
			!card.decks.some((deck) => deck.toLowerCase() === trimmedSearch.toLowerCase()),
	);

	// Resolve what Enter should add: an existing deck option (exact, case-insensitive), or the
	// typed value as a new deck. Returns null when there is nothing to add.
	function resolveDeck(raw: string): string | null {
		const trimmed = raw.trim();
		if (!trimmed) return null;
		const existing = optionList.find(
			(option) => option.value.toLowerCase() === trimmed.toLowerCase(),
		);
		if (existing) return existing.value;
		const alreadyOnCard = card.decks.some((deck) => deck.toLowerCase() === trimmed.toLowerCase());
		return alreadyOnCard ? null : trimmed;
	}

	// Pointer selection reports the full value array; commit the delta against the
	// card's current decks. Each toggle commits immediately and keeps the picker open
	// (closing and search reset happen in handleOpenChange when the picker closes).
	function handleSelectionChange(value: string[]): void {
		const added = value.filter((deck) => !card.decks.includes(deck));
		const removed = card.decks.filter((deck) => !value.includes(deck));
		for (const deck of added) onAddDeck(deck);
		for (const deck of removed) onRemoveDeck(deck);
	}

	// Enter adds the typed value (selecting an existing deck or creating a new one) and closes.
	// preventDefault stops bits-ui's highlighted-item toggle from also running (the forwarded
	// onkeydown is composed before bits-ui's, and composeHandlers skips after preventDefault).
	function handleKeydown(event: KeyboardEvent): void {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		const deck = resolveDeck(trimmedSearch);
		if (!deck) return;
		onAddDeck(deck);
		closePicker();
	}

	// Clear the search when the picker closes so the next open starts fresh.
	function handleOpenChange(open: boolean): void {
		if (!open) search = '';
	}

	// Close when focus leaves the overlay (e.g. Tab, or activating another row's trigger).
	function handleFocusOutside(): void {
		closePicker();
	}

	function closePicker(): void {
		pickerOpen = false;
	}

	// Focus the search input once the picker overlay has mounted.
	$effect(() => {
		if (pickerOpen && inputEl) {
			queueMicrotask(() => inputEl?.focus());
		}
	});
</script>

<Combobox.Root
	type="multiple"
	items={optionList}
	value={card.decks}
	bind:open={pickerOpen}
	onOpenChange={handleOpenChange}
	onValueChange={handleSelectionChange}
	inputValue={search}
	class="ml-manage-deck-cell {className ?? ''}"
>
	<div class="ml-manage-deck-cell__display" bind:this={customAnchor}>
		{#if card.decks.length === 0}
			<span class="ml-manage-deck-cell__muted">No decks</span>
		{:else}
			{#each card.decks as deck (deck)}
				<Chip onDelete={() => onRemoveDeck(deck)}>{deck}</Chip>
			{/each}
		{/if}
		<Combobox.Trigger class="ml-manage-deck-cell__plus" ariaLabel={`Add deck to ${card.file}`}>
			<Icon name="plus" size={14} />
		</Combobox.Trigger>
	</div>

	<Combobox.Portal>
		<Combobox.Content
			class="ml-manage-deck-cell__picker"
			{customAnchor}
			onFocusOutside={handleFocusOutside}
		>
			<Combobox.Input
				bind:ref={inputEl}
				placeholder="Search or create deck"
				aria-label="Search or create deck"
				oninput={(event) => (search = event.currentTarget.value)}
				onkeydown={handleKeydown}
			/>
			<Combobox.Viewport>
				{#each filteredOptions as option (option.value)}
					<Combobox.Item value={option.value} label={option.label} />
				{/each}
				{#if filteredOptions.length === 0 && !canCreate}
					<Combobox.Empty>No decks found</Combobox.Empty>
				{/if}
				{#if canCreate}
					<Combobox.Create value={trimmedSearch} label={`Create "${trimmedSearch}"`} />
				{/if}
			</Combobox.Viewport>
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>

<style lang="scss">
	@use 'tokens' as *;
	@use 'breakpoints' as *;

	/* Class is applied to the Combobox.Root wrapper via the `class` prop. */
	:global(.ml-combobox.ml-manage-deck-cell) {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		min-width: 200px;
	}

	.ml-manage-deck-cell__display {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: $spacing-xxs;
		min-width: 0;
	}

	.ml-manage-deck-cell__muted {
		color: $text-muted;
		font-style: italic;
	}

	/* Plus trigger: inline with chips on desktop, full width on touch devices. */
	:global(.ml-combobox__trigger.ml-manage-deck-cell__plus) {
		position: static;
		transform: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		padding: 0;
		margin-left: auto;
		flex: 0 0 auto;
		color: $text-muted;
		background: none;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-sm;
		cursor: pointer;
		transition:
			color $transition-fast,
			border-color $transition-fast;
	}

	:global(.ml-combobox__trigger.ml-manage-deck-cell__plus:hover),
	:global(.ml-combobox__trigger.ml-manage-deck-cell__plus:focus-visible) {
		color: $interactive-accent;
		border-color: $interactive-accent;
		outline: none;
	}

	/* Picker overlay: ensure a usable width since it anchors to the small plus trigger. */
	:global .ml-combobox__content.ml-manage-deck-cell__picker {
		min-width: min(260px, calc(100vw - 32px));
	}

	/* A full-width add-deck button is easier to reach on touch devices. */
	@media (max-width: $mobile-breakpoint) {
		:global(.ml-combobox__trigger.ml-manage-deck-cell__plus) {
			width: 100%;
			height: 32px;
			margin-left: 0;
			flex: 0 0 100%;
		}
	}
</style>
