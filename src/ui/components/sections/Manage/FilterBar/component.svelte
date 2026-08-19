<script lang="ts">
	import type { CardStatus, CardType } from '@/schemas';
	import { Button, Combobox, Icon, Select } from '@/ui/components/elements';
	import { filterOptions } from '@/ui/components/elements/Combobox/utils';
	import { MANAGE_STATUS_OPTIONS, MANAGE_TYPE_OPTIONS } from '../options';
	import type ManageFilterBarProps from './types';

	let { filters, deckOptions, onChange, onReset, className }: ManageFilterBarProps = $props();

	// An empty string is meaningful to the filter state, so use a stable non-empty
	// value for the combobox's "All decks" item.
	const ALL_DECKS_VALUE = '__mnemoloop_all_decks__';
	let deckSearch = $state('');
	let deckPickerOpen = $state(false);
	let deckInput: HTMLInputElement | null = $state(null);

	const deckItems = $derived([
		{ value: ALL_DECKS_VALUE, label: 'All decks' },
		...deckOptions.map((deck) => ({ value: deck, label: deck })),
	]);
	const filteredDeckItems = $derived(filterOptions(deckItems, deckSearch));
	const selectedDeckValue = $derived(filters.deck || ALL_DECKS_VALUE);

	function withAllOption(
		options: { value: string; label: string }[],
	): { value: string; label: string }[] {
		return [{ value: '', label: 'All' }, ...options];
	}

	const hasActiveFilters = $derived(
		filters.type !== '' ||
			filters.status !== '' ||
			filters.deck !== '' ||
			(filters.query ?? '').trim() !== '',
	);

	function handleDeckChange(value: string | undefined): void {
		onChange({ deck: value === ALL_DECKS_VALUE ? '' : (value ?? '') });
		deckSearch = '';
		deckPickerOpen = false;
	}

	function handleDeckOpenChange(open: boolean): void {
		deckPickerOpen = open;
		if (!open) deckSearch = '';
	}

	function handleQueryInput(event: Event): void {
		onChange({ query: (event.currentTarget as HTMLInputElement).value });
	}

	$effect(() => {
		if (deckPickerOpen && deckInput) queueMicrotask(() => deckInput?.focus());
	});
</script>

<div class="ml-manage__filters {className ?? ''}">
	<div class="ml-manage__filter-search">
		<label for="ml-manage-filter-query">Search filename or deck</label>
		<input
			id="ml-manage-filter-query"
			type="search"
			placeholder="Search filename or deck"
			value={filters.query ?? ''}
			oninput={handleQueryInput}
		/>
	</div>
	<Select
		id="ml-manage-filter-type"
		label="Type"
		className="ml-manage__filter-select"
		options={withAllOption(MANAGE_TYPE_OPTIONS)}
		value={filters.type}
		onchange={(v) => onChange({ type: v as CardType })}
	/>
	<Select
		id="ml-manage-filter-status"
		label="Status"
		className="ml-manage__filter-select"
		options={withAllOption(MANAGE_STATUS_OPTIONS)}
		value={filters.status}
		onchange={(v) => onChange({ status: v as CardStatus })}
	/>
	<div class="ml-manage__deck-filter">
		<Combobox.Root
			type="single"
			items={deckItems}
			value={selectedDeckValue}
			open={deckPickerOpen}
			onOpenChange={handleDeckOpenChange}
			onValueChange={handleDeckChange}
			inputValue={deckSearch}
			class="ml-manage__deck-combobox"
		>
			<Combobox.Label for="ml-manage-filter-deck">Deck</Combobox.Label>
			<Combobox.Trigger
				id="ml-manage-filter-deck"
				ariaLabel="Deck filter"
				class="ml-manage__deck-trigger"
			>
				<span class="ml-manage__deck-label">{filters.deck || 'All decks'}</span>
				<Icon name="chevron-down" size={14} />
			</Combobox.Trigger>
			<Combobox.Portal>
				<Combobox.Content class="ml-manage__deck-content">
					<Combobox.Input
						bind:ref={deckInput}
						placeholder="Search decks"
						aria-label="Search decks"
						oninput={(event) => (deckSearch = event.currentTarget.value)}
					/>
					<Combobox.Viewport>
						{#each filteredDeckItems as option (option.value)}
							<Combobox.Item value={option.value} label={option.label} />
						{/each}
						{#if filteredDeckItems.length === 0}
							<Combobox.Empty>No decks found</Combobox.Empty>
						{/if}
					</Combobox.Viewport>
				</Combobox.Content>
			</Combobox.Portal>
		</Combobox.Root>
	</div>
	<Button
		type="button"
		variant="ghost"
		class="ml-manage__reset"
		disabled={!hasActiveFilters}
		onclick={onReset}
	>
		Reset filters
	</Button>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-manage__filters {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-sm;
		align-items: flex-end;
	}

	.ml-manage__filter-search,
	.ml-manage__deck-filter {
		display: flex;
		flex: 1 1 220px;
		flex-direction: column;
		gap: $spacing-xs;
		min-width: 180px;
		max-width: 280px;
	}

	.ml-manage__filter-search label,
	:global(.ml-manage__deck-filter .ml-combobox__label) {
		font-size: $font-xs;
		font-weight: $font-md;
		color: $text-normal;
	}

	.ml-manage__filter-search input {
		width: 100%;
		min-height: 44px;
		padding: $spacing-sm;
		font-family: inherit;
		font-size: $font-sm;
		color: $text-normal;
		background-color: $background-primary;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-input;
	}

	.ml-manage__filter-search input:focus {
		outline: none;
		border-color: $interactive-accent;
		box-shadow: 0 0 0 2px $background-modifier-border-focus;
	}

	:global(.ml-select-wrapper.ml-manage__filter-select) {
		flex: 1 1 180px;
		max-width: 220px;
	}

	:global(.ml-combobox.ml-manage__deck-combobox) {
		width: 100%;
	}

	:global(.ml-combobox__trigger.ml-manage__deck-trigger) {
		position: static;
		transform: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		min-height: 44px;
		padding: $spacing-sm;
		font-family: inherit;
		font-size: $font-sm;
		text-align: left;
		color: $text-normal;
		background-color: $background-primary;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-input;
	}

	.ml-manage__deck-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.ml-combobox__trigger.ml-manage__deck-trigger:focus-visible),
	:global(.ml-combobox__trigger.ml-manage__deck-trigger[data-state='open']) {
		outline: none;
		border-color: $interactive-accent;
		box-shadow: 0 0 0 2px $background-modifier-border-focus;
	}

	:global(.ml-combobox__content.ml-manage__deck-content) {
		min-width: min(280px, calc(100vw - 32px));
	}

	:global button.ml-manage__reset {
		border: none;
		color: $interactive-accent;
		cursor: pointer;
		font-size: $font-sm;
		padding: $spacing-xs;
	}

	.ml-manage__reset:hover:not(:disabled) {
		color: $text-accent-hover;
	}

	.ml-manage__reset:disabled {
		color: $text-muted;
		cursor: default;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-manage__filter-search,
		.ml-manage__deck-filter,
		:global(.ml-select-wrapper.ml-manage__filter-select) {
			flex: 1 1 100%;
			max-width: none;
		}

		.ml-manage__filter-search input,
		:global(.ml-combobox__input) {
			font-size: 1rem; /* Prevent iOS zoom */
		}
	}
</style>
