import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { createRawSnippet } from 'svelte';
import Badge from '@/ui/components/elements/Badge/component.svelte';

function text(value: string) {
	return createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));
}

describe('Badge', () => {
	it('defaults to a neutral, 4px badge', () => {
		const { body } = render(Badge, { props: { children: text('basic') } });
		expect(body).toContain('ml-badge--neutral');
		expect(body).toContain('ml-badge--sm');
		expect(body).not.toContain('ml-badge__dot');
	});

	it('renders a semantic tone, radius, and dot', () => {
		const { body } = render(Badge, {
			props: { variant: 'success', radius: 'md', dot: true, children: text('ACTIVE') },
		});
		expect(body).toContain('ml-badge--success');
		expect(body).toContain('ml-badge--md');
		expect(body).toContain('ml-badge__dot');
		expect(body).toContain('ACTIVE');
	});

	it('supports the ghost tone', () => {
		const { body } = render(Badge, { props: { variant: 'ghost', children: text('x') } });
		expect(body).toContain('ml-badge--ghost');
	});
});
