import { default as TableRoot } from './Root/component.svelte';
import { default as TableHead } from './Head/component.svelte';
import { default as TableRow } from './Row/component.svelte';
import { default as TableTh } from './Th/component.svelte';
import { default as TableBody } from './Body/component.svelte';
import { default as TableTd } from './Td/component.svelte';
import { default as TableEmptyState } from './EmptyState/component.svelte';

/**
 * Compound table element built on semantic HTML table markup.
 *
 * Usage:
 * ```svelte
 * <Table.Root className="my-table">
 *   <Table.Head>
 *     <Table.Row>
 *       <Table.Th scope="col">Name</Table.Th>
 *     </Table.Row>
 *   </Table.Head>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Td>Ada</Table.Td>
 *     </Table.Row>
 *   </Table.Body>
 * </Table.Root>
 * ```
 *
 * Sub-components:
 * - `Root` — the `<table>` element with default table styling.
 * - `Head` — the `<thead>` element.
 * - `Row` — a `<tr>` with alignment, hover, and last-row border handling.
 * - `Th` — a `<th>` header cell with `scope` support and muted uppercase styling.
 * - `Body` — the `<tbody>` element.
 * - `Td` — a `<td>` data cell with `colspan`/`rowspan` support.
 * - `EmptyState` — a styled container for empty-table content with an optional action.
 */
export default {
	Root: TableRoot,
	Head: TableHead,
	Row: TableRow,
	Th: TableTh,
	Body: TableBody,
	Td: TableTd,
	EmptyState: TableEmptyState,
};
