import { MarkdownRenderer } from 'obsidian';
import { getAppContext } from '@/ui/context/AppContext';

export interface MarkdownOptions {
	content: string;
	sourcePath?: string;
}

/**
 * Svelte action to render markdown content using Obsidian's MarkdownRenderer
 * Usage: <div use:renderMarkdown={{ content, sourcePath }} />
 *
 * Gets App and Component from Svelte context (set in App.svelte)
 */
export function renderMarkdown(
	node: HTMLElement,
	options: MarkdownOptions,
): { destroy: () => void; update: (options: MarkdownOptions) => void } {
	const context = getAppContext();
	if (!context) {
		throw new Error('renderMarkdown must be used within an AppContext provider');
	}

	const { app, component } = context;
	let currentOptions = options;

	function handleClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const link = target.closest('a');
		if (!link) return;

		if (link.classList.contains('internal-link')) {
			const href = link.getAttribute('data-href') || link.textContent;
			event.preventDefault();
			void app.workspace.openLinkText(href, currentOptions.sourcePath ?? '', false);
		}
		// external links: let browser handle or window.open()
	}

	async function doRender() {
		node.empty();
		node.addEventListener('click', handleClick);
		await MarkdownRenderer.render(
			app,
			currentOptions.content,
			node,
			currentOptions.sourcePath ?? '',
			component,
		);
	}

	void doRender();

	return {
		update(newOptions: MarkdownOptions) {
			if (
				newOptions.content !== currentOptions.content ||
				newOptions.sourcePath !== currentOptions.sourcePath
			) {
				currentOptions = newOptions;
				void doRender();
			}
		},
		destroy() {
			node.empty();
			node.removeEventListener('click', handleClick);
			// Component cleanup is handled automatically when ItemView closes
		},
	};
}
