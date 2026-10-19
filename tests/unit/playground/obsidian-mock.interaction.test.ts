import { beforeAll, describe, expect, it } from 'vitest';
import {
	addIcon,
	installObsidianDomExtensions,
	MarkdownRenderer,
	setIcon,
} from '../../../playground/obsidian';

describe('playground obsidian mock', () => {
	beforeAll(() => {
		installObsidianDomExtensions();
	});

	it('renders a vendored icon as SVG child nodes', () => {
		const host = document.createElement('span');

		setIcon(host, 'play');

		const svg = host.querySelector('svg');
		expect(svg).not.toBeNull();
		expect(svg?.getAttribute('data-icon')).toBe('play');
		expect(svg?.querySelectorAll('path').length).toBeGreaterThan(0);
	});

	it('renders icons registered through addIcon', () => {
		const host = document.createElement('span');
		addIcon('mnemoloop-test-icon', '<circle cx="12" cy="12" r="10" />');

		setIcon(host, 'mnemoloop-test-icon');

		expect(host.querySelectorAll('svg circle')).toHaveLength(1);
	});

	it('leaves the host empty for an unknown icon', () => {
		const host = document.createElement('span');

		setIcon(host, 'not-a-real-icon');

		expect(host.childNodes).toHaveLength(0);
	});

	it('renders markdown blocks and inline formatting without interpreting HTML', () => {
		const host = document.createElement('div');

		MarkdownRenderer.renderer(
			{},
			'# Title\n\n- **bold**\n- *italic* and `code`\n\nA <script>alert(1)</script> line',
			host,
		);

		expect(host.querySelector('h1')?.textContent).toBe('Title');
		expect(host.querySelectorAll('ul li')).toHaveLength(2);
		expect(host.querySelector('strong')?.textContent).toBe('bold');
		expect(host.querySelector('em')?.textContent).toBe('italic');
		expect(host.querySelector('code')?.textContent).toBe('code');
		expect(host.querySelector('script')).toBeNull();
		expect(host.textContent).toContain('<script>alert(1)</script>');
	});
});
