<script lang="ts">
	import type { CardStatus, CardType } from '@/schemas';
	import { MANAGE_STATUS_OPTIONS, MANAGE_TYPE_OPTIONS } from '../options';
	import { Button, Select } from '@/ui/components/elements';
	import type ManageFilterBarProps from './types';

	let { filters, deckOptions, onChange, onReset, className }: ManageFilterBarProps = $props();

	function withAllOption(
		options: { value: string; label: string }[],
	): { value: string; label: string }[] {
		return [{ value: '', label: 'All' }, ...options];
	}

	const hasActiveFilters = $derived(
		filters.type !== '' || filters.status !== '' || filters.deck !== '',
	);
</script>

<div class="ml-manage__filters {className ?? ''}">
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
	<Select
		id="ml-manage-filter-deck"
		label="Deck"
		className="ml-manage__filter-select"
		options={withAllOption(deckOptions.map((deck) => ({ value: deck, label: deck })))}
		value={filters.deck}
		onchange={(v) => onChange({ deck: v })}
	/>
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

	:global(.ml-select-wrapper.ml-manage__filter-select) {
		flex: 1 1 180px;
		max-width: 220px;
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
		:global(.ml-select-wrapper.ml-manage__filter-select) {
			flex: 1 1 100%;
			max-width: none;
		}
	}
</style>
