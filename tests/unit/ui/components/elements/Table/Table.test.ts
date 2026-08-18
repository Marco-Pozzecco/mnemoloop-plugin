import { describe, it, expect } from 'vitest';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import Table from '@/ui/components/elements/Table';
import TableRoot from '@/ui/components/elements/Table/Root/component.svelte';
import TableHead from '@/ui/components/elements/Table/Head/component.svelte';
import TableRow from '@/ui/components/elements/Table/Row/component.svelte';
import TableTh from '@/ui/components/elements/Table/Th/component.svelte';
import TableBody from '@/ui/components/elements/Table/Body/component.svelte';
import TableTd from '@/ui/components/elements/Table/Td/component.svelte';
import TableEmptyState from '@/ui/components/elements/Table/EmptyState/component.svelte';

describe('Table element', () => {
	describe('compound API', () => {
		it('exposes Root, Head, Row, Th, Body, Td, and EmptyState sub-components', () => {
			expect(Table).toEqual({
				Root: TableRoot,
				Head: TableHead,
				Row: TableRow,
				Th: TableTh,
				Body: TableBody,
				Td: TableTd,
				EmptyState: TableEmptyState,
			});
		});
	});

	describe('Table.Root', () => {
		it('renders a semantic <table> element', () => {
			const { body } = render(TableRoot, { props: {} });
			expect(body).toContain('<table');
			expect(body).toContain('ml-table');
		});

		it('appends a custom className to the rendered table', () => {
			const { body } = render(TableRoot, { props: { className: 'ml-custom-table' } });
			expect(body).toContain('ml-custom-table');
		});
	});

	describe('Table.Head', () => {
		it('renders a semantic <thead> element', () => {
			const { body } = render(TableHead, { props: {} });
			expect(body).toContain('<thead');
		});
	});

	describe('Table.Row', () => {
		it('renders a semantic <tr> element', () => {
			const { body } = render(TableRow, { props: {} });
			expect(body).toContain('<tr');
		});
	});

	describe('Table.Th', () => {
		it('renders a semantic <th> element with scope', () => {
			const children = createRawSnippet(() => ({ render: () => 'Type' }));
			const { body } = render(TableTh, { props: { scope: 'col', children } });
			expect(body).toContain('<th');
			expect(body).toContain('scope="col"');
			expect(body).toContain('Type');
		});
	});

	describe('Table.Body', () => {
		it('renders a semantic <tbody> element', () => {
			const { body } = render(TableBody, { props: {} });
			expect(body).toContain('<tbody');
		});
	});

	describe('Table.Td', () => {
		it('renders a semantic <td> element', () => {
			const children = createRawSnippet(() => ({ render: () => 'cell' }));
			const { body } = render(TableTd, { props: { children } });
			expect(body).toContain('<td');
			expect(body).toContain('cell');
		});

		it('applies colspan and rowspan attributes', () => {
			const children = createRawSnippet(() => ({ render: () => 'cell' }));
			const { body } = render(TableTd, {
				props: { colspan: 2, rowspan: 3, children },
			});
			expect(body).toContain('colspan="2"');
			expect(body).toContain('rowspan="3"');
		});
	});

	describe('Table.EmptyState', () => {
		it('renders the title and message', () => {
			const { body } = render(TableEmptyState, {
				props: { title: 'No cards', message: 'Try adding one' },
			});
			expect(body).toContain('No cards');
			expect(body).toContain('Try adding one');
		});

		it('renders the action snippet when provided', () => {
			const action = createRawSnippet(() => ({
				render: () => '<button>Add flashcard</button>',
			}));
			const { body } = render(TableEmptyState, {
				props: { title: 'No cards', action },
			});
			expect(body).toContain('<button>Add flashcard</button>');
		});
	});
});
