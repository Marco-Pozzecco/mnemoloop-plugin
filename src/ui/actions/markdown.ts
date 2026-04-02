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

	async function doRender() {
		node.empty();
		await MarkdownRenderer.render(
			app,
			currentOptions.content,
			node,
			currentOptions.sourcePath ?? '',
			component,
		);
	}

	doRender();

	return {
		update(newOptions: MarkdownOptions) {
			if (
				newOptions.content !== currentOptions.content ||
				newOptions.sourcePath !== currentOptions.sourcePath
			) {
				currentOptions = newOptions;
				doRender();
			}
		},
		destroy() {
			node.empty();
			// Component cleanup is handled automatically when ItemView closes
		},
	};
}
