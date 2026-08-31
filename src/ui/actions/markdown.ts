import { Component, MarkdownRenderer } from 'obsidian';
import type { HoverParent } from 'obsidian';
import { APP_VIEW } from '@/ui/views/App/constants';
import { getAppContext } from '@/ui/context/AppContext';

export interface MarkdownOptions {
	content: string;
	sourcePath: string;
}

export interface MarkdownAction {
	update(options: MarkdownOptions): void;
	destroy(): void;
}

/**
 * Svelte action to render markdown content using Obsidian's MarkdownRenderer
 * Usage: <div use:renderMarkdown={{ content, sourcePath }} />
 *
 * Gets App and Component from Svelte context (set in App.svelte)
 */
export function renderMarkdown(node: HTMLElement, options: MarkdownOptions): MarkdownAction {
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

	function isHoverParent(value: Component): value is Component & HoverParent {
		return 'hoverPopover' in value;
	}

	function handleMouseOver(event: MouseEvent) {
		const target = event.target;
		const link = target instanceof Element ? target.closest('a.internal-link') : null;
		if (!link || !isHoverParent(component)) return;

		const linktext = link.getAttribute('data-href') || link.textContent || '';
		if (!linktext) return;

		app.workspace.trigger('hover-link', {
			event,
			source: APP_VIEW,
			hoverParent: component,
			targetEl: link,
			linktext,
			sourcePath: currentOptions.sourcePath,
		});
	}

	function removeCurrentChild() {
		if (!currentChild) return;
		component.removeChild(currentChild);
		currentChild = null;
	}

	function doRender() {
		if (destroyed) return;

		removeCurrentChild();

		const target = activeDocument.createElement('div');
		target.classList.add('ml-markdown-rendered', 'markdown-rendered');
		node.replaceChildren(target);

		currentChild = component.addChild(new Component());
		void MarkdownRenderer.render(
			app,
			currentOptions.content,
			target,
			currentOptions.sourcePath,
			currentChild,
		);
	}

	node.addEventListener('click', handleClick);
	node.addEventListener('mouseover', handleMouseOver);
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
			node.removeEventListener('mouseover', handleMouseOver);
		},
	};
}
