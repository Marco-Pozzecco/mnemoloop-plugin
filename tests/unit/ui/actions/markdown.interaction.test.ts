// @vitest-environment jsdom
import '../../../helpers/dom-polyfills';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Component } from 'obsidian';
import type { App } from 'obsidian';
import { MarkdownRenderer } from 'obsidian';
import { renderMarkdown } from '@/ui/actions/markdown';
import type { MarkdownAction } from '@/ui/actions/markdown';
import { getAppContext } from '@/ui/context/AppContext';
import { APP_VIEW } from '@/ui/views/App/constants';

vi.mock('@/ui/context/AppContext', () => ({
	getAppContext: vi.fn(),
}));

const getAppContextMock = vi.mocked(getAppContext);
const renderMock = vi.mocked(MarkdownRenderer.render);

describe('renderMarkdown page preview integration', () => {
	interface WorkspaceMock {
		trigger: (eventName: string, payload: unknown) => unknown;
		openLinkText: (href: string, sourcePath: string, newLeaf: boolean) => unknown;
	}

	let target: HTMLDivElement;
	let action: MarkdownAction | undefined;
	let app: { workspace: WorkspaceMock };
	let hoverParent: Component & { hoverPopover: null };

	beforeEach(() => {
		target = activeDocument.createElement('div');
		activeDocument.body.append(target);
		app = {
			workspace: {
				trigger: vi.fn(),
				openLinkText: vi.fn(),
			},
		};
		hoverParent = Object.assign(new Component(), { hoverPopover: null });
		getAppContextMock.mockReturnValue({ app: app as unknown as App, component: hoverParent });
		renderMock.mockReset();
		renderMock.mockImplementation(async (_app, content, renderTarget) => {
			const link = activeDocument.createElement('a');
			link.className = 'internal-link';
			link.dataset.href = content === 'updated' ? 'notes/Updated' : 'notes/Target';
			link.textContent = content === 'updated' ? 'Updated' : 'Target';

			const externalLink = activeDocument.createElement('a');
			externalLink.href = 'https://example.com';
			externalLink.textContent = 'External';
			renderTarget.append(link, externalLink);
		});
	});

	afterEach(() => {
		action?.destroy();
		target.remove();
		getAppContextMock.mockReset();
		renderMock.mockReset();
	});

	it('emits Obsidian hover-link events for internal links only', () => {
		action = renderMarkdown(target, {
			content: 'initial',
			sourcePath: 'notes/source.md',
		});

		const internalLink = target.querySelector<HTMLAnchorElement>('a.internal-link');
		const externalLink = target.querySelector<HTMLAnchorElement>('a:not(.internal-link)');
		expect(internalLink).not.toBeNull();
		expect(externalLink).not.toBeNull();
		if (!internalLink || !externalLink) return;

		const internalMouseOver = new MouseEvent('mouseover', { bubbles: true });
		internalLink.dispatchEvent(internalMouseOver);
		externalLink.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

		expect(app.workspace.trigger).toHaveBeenCalledTimes(1);
		expect(app.workspace.trigger).toHaveBeenCalledWith('hover-link', {
			event: internalMouseOver,
			source: APP_VIEW,
			hoverParent,
			targetEl: internalLink,
			linktext: 'notes/Target',
			sourcePath: 'notes/source.md',
		});
	});

	it('keeps the delegated preview handler across Markdown rerenders', () => {
		action = renderMarkdown(target, {
			content: 'initial',
			sourcePath: 'notes/source.md',
		});

		action.update({ content: 'updated', sourcePath: 'notes/updated-source.md' });
		const updatedLink = target.querySelector<HTMLAnchorElement>('a.internal-link');
		expect(updatedLink).not.toBeNull();
		if (!updatedLink) return;

		updatedLink.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

		expect(app.workspace.trigger).toHaveBeenCalledWith(
			'hover-link',
			expect.objectContaining({
				source: APP_VIEW,
				hoverParent,
				targetEl: updatedLink,
				linktext: 'notes/Updated',
				sourcePath: 'notes/updated-source.md',
			}),
		);
	});

	it('removes delegated handlers and rerenders after destroy', () => {
		action = renderMarkdown(target, {
			content: 'initial',
			sourcePath: 'notes/source.md',
		});

		const internalLink = target.querySelector<HTMLAnchorElement>('a.internal-link');
		expect(internalLink).not.toBeNull();
		if (!internalLink) return;

		action.destroy();
		action.destroy();
		action.update({ content: 'updated', sourcePath: 'notes/updated-source.md' });
		internalLink.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

		expect(app.workspace.trigger).not.toHaveBeenCalled();
		expect(renderMock).toHaveBeenCalledTimes(1);
	});
});
