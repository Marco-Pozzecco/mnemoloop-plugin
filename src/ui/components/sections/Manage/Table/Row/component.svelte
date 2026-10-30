<script lang="ts">
	import { Badge, Icon, Table } from '@/ui/components/elements';
	import { formatDate } from '@/utils/statistics-utils';
	import ManageDeckChips from '../../DeckChips/component.svelte';
	import { MANAGE_STATUS_VARIANT, cardTypeLabel } from '../../options';
	import type ManageTableRowProps from './types';

	let { card, preview, href, selected = false, onOpen, className }: ManageTableRowProps = $props();

	const statusVariant = $derived(MANAGE_STATUS_VARIANT[card.status] ?? 'neutral');

	/** Default click opens the sheet; modifier-click keeps the note link native. */
	function handleClick(event: MouseEvent): void {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}
		event.preventDefault();
		onOpen();
	}
</script>

<Table.Row {selected} {className}>
	<Table.Td>
		<Badge variant="neutral">{cardTypeLabel(card.card_type)}</Badge>
	</Table.Td>
	<Table.Td>
		<a
			class="ml-table__row-link ml-manage-row__preview"
			{href}
			title={preview}
			onclick={handleClick}
		>
			{preview ?? 'Loading…'}
		</a>
	</Table.Td>
	<Table.Td>
		<ManageDeckChips decks={card.decks} />
	</Table.Td>
	<Table.Td>
		<Badge variant={statusVariant} radius="md">{card.status}</Badge>
	</Table.Td>
	<Table.Td>
		<span class="ml-manage-row__due">{formatDate(new Date(card.due))}</span>
	</Table.Td>
	<Table.Td class="ml-manage-row__open">
		<Icon name="chevron-right" size={16} />
	</Table.Td>
</Table.Row>

<style lang="scss">
	@use 'tokens' as *;

	.ml-manage-row__preview {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: $text-muted;
	}

	.ml-manage-row__due {
		font-size: $font-xs;
		color: $text-faint;
		white-space: nowrap;
	}

	:global(.ml-manage-row__open) {
		width: $control-md;
		color: $text-faint;
		text-align: center;
	}
</style>
