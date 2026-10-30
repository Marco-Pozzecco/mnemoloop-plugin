<script lang="ts">
	import { Chip, Combobox, Icon } from '@/ui/components/elements';
	import { canCreateNew, filterOptions } from '@/ui/components/elements/Combobox/utils';
	import type DeckPickerProps from './types';

	let { decks, deckOptions, onAdd, onRemove, disabled = false }: DeckPickerProps = $props();

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
			!decks.some((deck) => deck.toLowerCase() === trimmedSearch.toLowerCase()),
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
		const alreadyOnCard = decks.some((deck) => deck.toLowerCase() === trimmed.toLowerCase());
		return alreadyOnCard ? null : trimmed;
	}

	// Pointer selection reports the full value array; commit the delta against the
	// card's current decks. Each toggle commits immediately and keeps the picker open.
	function handleSelectionChange(value: string[]): void {
		const added = value.filter((deck) => !decks.includes(deck));
		const removed = decks.filter((deck) => !value.includes(deck));
		for (const deck of added) onAdd(deck);
		for (const deck of removed) onRemove(deck);
	}

	// Enter adds the typed value (selecting an existing deck or creating a new one) and closes.
	function handleKeydown(event: KeyboardEvent): void {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		const deck = resolveDeck(trimmedSearch);
		if (!deck) return;
		onAdd(deck);
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
	value={decks}
	bind:open={pickerOpen}
	{disabled}
	onOpenChange={handleOpenChange}
	onValueChange={handleSelectionChange}
	inputValue={search}
	class="ml-deck-picker"
>
	<div class="ml-deck-picker__row" bind:this={customAnchor}>
		{#each decks as deck (deck)}
			<Chip
				variant="filled"
				shape="rounded"
				size="sm"
				removeLabel={`Remove ${deck}`}
				onDelete={() => onRemove(deck)}
			>
				{deck}
			</Chip>
		{/each}
		<Combobox.Trigger variant="bare" ariaLabel="Add deck" class="ml-deck-picker__add">
			<Icon name="plus" size={14} />
		</Combobox.Trigger>
	</div>

	<Combobox.Portal>
		<Combobox.Content {customAnchor} onFocusOutside={handleFocusOutside}>
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

	.ml-deck-picker__row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: $spacing-xxs;
		min-width: 0;
	}

	:global(.ml-combobox__trigger.ml-deck-picker__add) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: $badge-height;
		height: $badge-height;
		min-width: 0;
		min-height: 0;
		padding: 0;
		color: $text-muted;
		border: 1px solid $line-subtle;
		border-radius: $radius-sm;
	}

	:global(.ml-combobox__trigger.ml-deck-picker__add:hover) {
		color: $text-normal;
		border-color: $line-strong;
	}

	@media (hover: none) and (pointer: coarse), (max-width: $mobile-breakpoint) {
		:global(.ml-combobox__trigger.ml-deck-picker__add) {
			width: $control-md;
			height: $control-md;
		}
	}
</style>
