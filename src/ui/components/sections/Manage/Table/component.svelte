<script lang="ts">
	import { Table } from '@/ui/components/elements';
	import TableRow from './Row/component.svelte';
	import type ManageTableProps from './types';

	let { cards, previews, hrefFor, selectedUuid = null, onOpen }: ManageTableProps = $props();
</script>

<Table.Root caption="Manage flashcards" className="ml-manage-table">
	<colgroup>
		<col class="ml-manage-table__col-type" />
		<col />
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

	.ml-manage-table__col-type {
		width: 96px;
	}

	.ml-manage-table__col-decks {
		width: 232px;
	}

	.ml-manage-table__col-status {
		width: 132px;
	}

	.ml-manage-table__col-due {
		width: 104px;
	}

	.ml-manage-table__col-open {
		width: $control-md;
	}

	/* Fixed layout keeps the scan row on one line; the preview truncates. */
	:global(.ml-manage-table) {
		table-layout: fixed;
	}
</style>
