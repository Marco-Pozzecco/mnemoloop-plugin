<script lang="ts">
	import type { CardStatus, CardType } from '@/schemas';
	import { Button, Combobox, Input, Select } from '@/ui/components/elements';
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

	$effect(() => {
		if (deckPickerOpen && deckInput) queueMicrotask(() => deckInput?.focus());
	});
</script>

<div class="ml-manage__filters {className ?? ''}">
	<div class="ml-manage__field ml-manage__field--search">
		<Input
			id="ml-manage-filter-query"
			type="search"
			label="Search filename or deck"
			placeholder="Search filename or deck"
			value={filters.query ?? ''}
			oninput={(value) => onChange({ query: value })}
		/>
	</div>

	<div class="ml-manage__field ml-manage__field--select">
		<Select
			id="ml-manage-filter-type"
			label="Type"
			options={withAllOption(MANAGE_TYPE_OPTIONS)}
			value={filters.type}
			onchange={(v) => onChange({ type: v as CardType })}
		/>
	</div>

	<div class="ml-manage__field ml-manage__field--select">
		<Select
			id="ml-manage-filter-status"
			label="Status"
			options={withAllOption(MANAGE_STATUS_OPTIONS)}
			value={filters.status}
			onchange={(v) => onChange({ status: v as CardStatus })}
		/>
	</div>

	<div class="ml-manage__field ml-manage__field--deck">
		<Combobox.Root
			type="single"
			items={deckItems}
			value={selectedDeckValue}
			open={deckPickerOpen}
			onOpenChange={handleDeckOpenChange}
			onValueChange={handleDeckChange}
			inputValue={deckSearch}
		>
			<Combobox.Label for="ml-manage-filter-deck">Deck</Combobox.Label>
			<Combobox.Trigger id="ml-manage-filter-deck" ariaLabel="Deck filter">
				<span class="ml-manage__deck-label">{filters.deck || 'All decks'}</span>
			</Combobox.Trigger>
			<Combobox.Portal>
				<Combobox.Content>
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

	<div class="ml-manage__reset">
		<Button type="button" variant="plain" size="medium" disabled={!hasActiveFilters} onclick={onReset}>
			Reset filters
		</Button>
	</div>
</div>

<style lang="scss">
	@use 'tokens' as *;
	@use 'breakpoints' as *;

	.ml-manage__filters {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: $spacing-xs;
	}

	.ml-manage__field {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.ml-manage__field--search {
		flex: 1 1 240px;
		max-width: 300px;
	}

	.ml-manage__field--select {
		flex: 0 1 204px;
	}

	.ml-manage__field--deck {
		flex: 1 1 240px;
		max-width: 272px;
	}

	.ml-manage__deck-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-manage__reset {
		display: flex;
	}

	@media (max-width: $mobile-breakpoint) {
		.ml-manage__filters {
			flex-direction: column;
			align-items: stretch;
		}

		.ml-manage__field--search,
		.ml-manage__field--select,
		.ml-manage__field--deck {
			flex: 1 1 auto;
			max-width: none;
		}

		.ml-manage__reset > * {
			flex: 1;
			justify-content: flex-start;
		}
	}
</style>
