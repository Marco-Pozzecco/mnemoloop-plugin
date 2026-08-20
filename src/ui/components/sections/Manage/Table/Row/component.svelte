<script lang="ts">
	import { Button, Icon, Select, Table } from '@/ui/components/elements';
	import { formatDate } from '@/utils/statistics-utils';
	import ManageDeckCell from '../DeckCell/component.svelte';
	import { MANAGE_STATUS_OPTIONS } from '../../options';
	import type ManageTableRowProps from './types';

	let {
		card,
		preview,
		deckOptions,
		onAddDeck,
		onRemoveDeck,
		onStatusChange,
		onEdit,
		onDelete,
		className,
	}: ManageTableRowProps = $props();

	const cardLabel = $derived(preview && !preview.includes('Loading') ? preview : 'this card');
</script>

<Table.Row {className}>
	<Table.Td>
		<span class="ml-manage-row__badge ml-manage-row__badge--{card.card_type}">
			{card.card_type}
		</span>
	</Table.Td>
	<Table.Td>
		<span class="ml-manage-row__preview" title={preview}>{preview ?? 'Loading…'}</span>
	</Table.Td>
	<Table.Td>
		<ManageDeckCell {card} {deckOptions} {onAddDeck} {onRemoveDeck} />
	</Table.Td>
	<Table.Td>
		<Select
			id={`ml-manage-status-${card.uuid}`}
			options={MANAGE_STATUS_OPTIONS}
			value={card.status}
			ariaLabel={`Status for ${cardLabel}`}
			onchange={onStatusChange}
		/>
	</Table.Td>
	<Table.Td>{formatDate(new Date(card.due))}</Table.Td>
	<Table.Td>
		<div class="ml-manage-row__actions">
			<Button variant="icon" size="small" ariaLabel={`Edit ${cardLabel}`} onclick={onEdit}>
				{#snippet icon()}
					<Icon name="pencil" size={14} />
				{/snippet}
			</Button>
			<Button variant="icon" size="small" ariaLabel={`Delete ${cardLabel}`} onclick={onDelete}>
				{#snippet icon()}
					<Icon name="trash-2" size={14} />
				{/snippet}
			</Button>
		</div>
	</Table.Td>
</Table.Row>

<style lang="scss">
	@use 'tokens' as *;

	.ml-manage-row__badge {
		display: inline-block;
		padding: 2px $spacing-xs;
		border-radius: $radius-sm;
		font-size: $font-xs;
		text-transform: capitalize;
		background-color: $background-modifier-hover;
	}

	.ml-manage-row__badge--basic {
		color: $interactive-accent;
	}

	.ml-manage-row__badge--sequence {
		color: $text-muted;
	}

	.ml-manage-row__badge--quiz {
		color: $text-normal;
	}

	.ml-manage-row__badge--cloze {
		color: $text-normal;
	}

	.ml-manage-row__preview {
		max-width: 320px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: $text-muted;
	}

	.ml-manage-row__actions {
		display: flex;
		gap: $spacing-xxs;
	}
</style>
