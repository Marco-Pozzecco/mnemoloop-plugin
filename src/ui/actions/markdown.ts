import { Component, MarkdownRenderer } from 'obsidian';
import { getAppContext } from '@/ui/context/AppContext';

export interface MarkdownOptions {
	content: string;
	sourcePath: string;
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
	let currentChild: Component | null = null;
	let destroyed = false;

	function handleClick(event: MouseEvent) {
		const target = event.target;
		const link = target instanceof Element ? target.closest('a') : null;
		if (!link) return;

		event.stopPropagation();
		if (link.classList.contains('internal-link')) {
			const href = link.getAttribute('data-href') || link.textContent || '';
			event.preventDefault();
			void app.workspace.openLinkText(href, currentOptions.sourcePath, false);
		}
	}

	function removeCurrentChild() {
		if (!currentChild) return;
		component.removeChild(currentChild);
		currentChild = null;
	}

	function doRender() {
		if (destroyed) return;

		removeCurrentChild();

		const target = document.createElement('div');
		target.classList.add('ml-markdown-rendered', 'markdown-rendered');
		node.replaceChildren(target);

		currentChild = component.addChild(new Component());
		void MarkdownRenderer.render(app, currentOptions.content, target, currentOptions.sourcePath, currentChild);
	}

	node.addEventListener('click', handleClick);
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
			if (destroyed) return;
			destroyed = true;
			removeCurrentChild();
			node.replaceChildren();
			node.removeEventListener('click', handleClick);
		},
	};
}
