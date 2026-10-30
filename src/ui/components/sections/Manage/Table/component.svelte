<script lang="ts">
	import { Table } from '@/ui/components/elements';
	import TableRow from './Row/component.svelte';
	import type ManageTableProps from './types';

	let { cards, previews, hrefFor, selectedUuid = null, onOpen }: ManageTableProps = $props();
</script>

<Table.Root caption="Manage flashcards" className="ml-manage-table">
	<colgroup>
		<col class="ml-manage-table__col-type" />
		<col class="ml-manage-table__col-preview" />
		<col class="ml-manage-table__col-decks" />
		<col class="ml-manage-table__col-status" />
		<col class="ml-manage-table__col-due" />
		<col class="ml-manage-table__col-open" />
	</colgroup>
	<Table.Head>
		<Table.Row>
			<Table.Th scope="col">Type</Table.Th>
			<Table.Th scope="col">Content preview</Table.Th>
			<Table.Th scope="col">Decks</Table.Th>
			<Table.Th scope="col">Status</Table.Th>
			<Table.Th scope="col">Due date</Table.Th>
			<Table.Th scope="col"><span class="ml-visually-hidden">Open</span></Table.Th>
		</Table.Row>
	</Table.Head>
	<Table.Body>
		{#each cards as card (card.uuid)}
			<TableRow
				{card}
				preview={previews[card.file]}
				href={hrefFor(card)}
				selected={card.uuid === selectedUuid}
				onOpen={() => onOpen(card)}
			/>
		{/each}
	</Table.Body>
</Table.Root>

<style lang="scss">
	@use 'tokens' as *;

	// Component geometry: the fixed columns keep their width, the preview takes
	// what is left, and decks is a share of the row rather than a fixed width — so
	// a narrow pane hands space back to the preview instead of starving it. The
	// table layout resolves a plain percentage on a `<col>` but ignores a
	// functional one, where `clamp()`/`min()` fall back to auto.
	$col-type: 96px;
	$col-decks: 20%;
	$col-status: 132px;
	$col-due: 104px;
	$col-open: $control-md;

	.ml-manage-table__col-type {
		width: $col-type;
	}

	.ml-manage-table__col-preview {
		width: auto;
	}

	.ml-manage-table__col-decks {
		width: $col-decks;
	}

	.ml-manage-table__col-status {
		width: $col-status;
	}

	.ml-manage-table__col-due {
		width: $col-due;
	}

	.ml-manage-table__col-open {
		width: $col-open;
	}

	/* Fixed layout keeps the scan row on one line; both content columns truncate. */
	:global(.ml-manage-table) {
		table-layout: fixed;
	}
</style>
