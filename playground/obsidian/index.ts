/**
 * Browser-safe implementation of the `obsidian` module surface the plugin UI
 * consumes. Vite aliases `obsidian` to this module for the playground build;
 * the production bundle still treats the real module as external.
 *
 * Fidelity is deliberately minimal and each reduction is a known limitation:
 * icons are placeholder glyphs, markdown rendering covers paragraphs, headings,
 * lists, emphasis and inline code, and no wiki-link resolution happens.
 */

import { installObsidianDomExtensions } from './dom';
import { LUCIDE_ICON_NODES } from './icons';

/* eslint-disable @typescript-eslint/no-explicit-any -- the mock mirrors an untyped runtime API surface. */

const SVG_NS = 'http://www.w3.org/2000/svg';

export class TAbstractFile {
	path: string;
	name: string;
	parent: TFolder | null = null;
	vault!: Vault;
	constructor(path: string) {
		this.path = path;
		this.name = path.slice(path.lastIndexOf('/') + 1);
	}
}

export class TFile extends TAbstractFile {
	extension: string;
	basename: string;
	stat: { ctime: number; mtime: number; size: number };

	constructor(path: string, basename = '') {
		super(path);
		this.extension = path.split('.').pop() ?? '';
		this.basename = basename || this.name.replace(/\.[^.]+$/, '');
		const now = Date.now();
		this.stat = { ctime: now, mtime: now, size: 0 };
	}
}

export class TFolder extends TAbstractFile {
	children: TAbstractFile[] = [];

	constructor(path: string, children: TAbstractFile[] = []) {
		super(path);
		this.children = children;
	}

	isRoot(): boolean {
		return this.path === '/';
	}
}

export class Vault {
	adapter: unknown = {};
}

export class Component {
	private _children: Component[] = [];
	private _registered: unknown[] = [];

	onload(): void {}
	onunload(): void {}

	load(): void {
		this.onload();
		for (const child of [...this._children]) child.load();
	}

	unload(): void {
		for (const child of [...this._children]) child.unload();
		this._registered = [];
		this.onunload();
	}

	addChild<T extends Component>(child: T): T {
		this._children.push(child);
		child.load();
		return child;
	}

	removeChild<T extends Component>(child: T): T {
		this._children = this._children.filter((candidate) => candidate !== child);
		child.unload();
		return child;
	}

	registerEvent(eventRef: unknown): void {
		this._registered.push(eventRef);
	}

	registerInterval(id: number): number {
		this._registered.push(id);
		return id;
	}

	registerDomEvent(): void {}
}

export class Modal {
	app: unknown;
	containerEl: HTMLElement;
	bgEl: HTMLElement;
	modalEl: HTMLElement;
	titleEl: HTMLElement;
	contentEl: HTMLElement;
	closeButtonEl: HTMLElement;
	scope: Record<string, unknown> = {};
	private _isOpen = false;

	constructor(app: unknown) {
		this.app = app;
		this.containerEl = document.createElement('div');
		this.containerEl.className = 'modal-container';
		this.bgEl = document.createElement('div');
		this.bgEl.className = 'modal-bg';
		this.bgEl.addEventListener('click', () => this.close());
		this.modalEl = document.createElement('div');
		this.modalEl.className = 'modal';
		this.closeButtonEl = document.createElement('div');
		this.closeButtonEl.className = 'modal-close-button';
		this.closeButtonEl.textContent = '×';
		this.closeButtonEl.addEventListener('click', () => this.close());
		this.titleEl = document.createElement('div');
		this.titleEl.className = 'modal-title';
		this.contentEl = document.createElement('div');
		this.contentEl.className = 'modal-content';
		this.modalEl.append(this.closeButtonEl, this.titleEl, this.contentEl);
		this.containerEl.append(this.bgEl, this.modalEl);
	}

	open(): void {
		if (this._isOpen) return;
		this._isOpen = true;
		document.body.appendChild(this.containerEl);
		this.onOpen();
	}

	close(): void {
		if (!this._isOpen) return;
		this._isOpen = false;
		this.onClose();
		this.containerEl.remove();
	}

	onOpen(): void {}
	onClose(): void {}

	setTitle(title: string): void {
		this.titleEl.textContent = title;
	}

	setContent(content: string): void {
		this.contentEl.textContent = content;
	}
}

export class ItemView extends Component {
	leaf: unknown;
	containerEl: HTMLElement;
	contentEl: HTMLElement;

	constructor(leaf?: unknown) {
		super();
		this.leaf = leaf;
		this.containerEl = document.createElement('div');
		this.containerEl.className = 'view-content';
		this.contentEl = document.createElement('div');
		this.contentEl.className = 'view-content-inner';
		this.containerEl.appendChild(this.contentEl);
	}

	getViewType(): string {
		return '';
	}

	getDisplayText(): string {
		return '';
	}

	getIcon(): string {
		return '';
	}

	async onOpen(): Promise<void> {}

	async onClose(): Promise<void> {}

	addAction(): HTMLElement {
		const element = document.createElement('div');
		this.containerEl.appendChild(element);
		return element;
	}
}

export class PluginSettingTab extends Component {
	app: unknown;
	plugin: unknown;
	containerEl: HTMLElement;

	constructor(app: unknown, plugin: unknown) {
		super();
		this.app = app;
		this.plugin = plugin;
		this.containerEl = document.createElement('div');
		this.containerEl.className = 'vertical-tab-content';
	}

	display(): void {}
	hide(): void {}
}

export class Plugin extends Component {
	app: unknown = {};
	manifest: Record<string, unknown> = {};

	constructor(app?: unknown, manifest?: Record<string, unknown>) {
		super();
		if (app) this.app = app;
		if (manifest) this.manifest = manifest;
	}

	addRibbonIcon(): HTMLElement {
		return document.createElement('div');
	}

	addStatusBarItem(): HTMLElement {
		return document.createElement('div');
	}

	registerView(): void {}
	addSettingTab(): void {}
	registerHoverLinkSource(): void {}
	addCommand(): void {}

	async loadData(): Promise<unknown> {
		return undefined;
	}

	async saveData(): Promise<void> {}
}

export class WorkspaceLeaf {
	view: unknown = null;
	async setViewState(): Promise<void> {}
	async openFile(): Promise<void> {}
}

export class Workspace {}

export class MetadataCache {}

export class App {}

export class Editor {}

export class MarkdownView {}

export class MarkdownFileInfo {}

export class Menu {
	private _items: { title: string; callback: () => void }[] = [];

	addItem(callback: (item: any) => void): this {
		const item: any = {
			title: '',
			icon: '',
			setTitle: (title: string) => {
				item.title = title;
				return item;
			},
			setIcon: (icon: string) => {
				item.icon = icon;
				return item;
			},
			onClick: (callback: () => void) => {
				item.callback = callback;
				return item;
			},
		};
		callback(item);
		if (item.title) this._items.push({ title: item.title, callback: item.callback ?? (() => {}) });
		return this;
	}

	showAtPosition(): void {
		this.show();
	}

	showAtMouseEvent(): void {
		this.show();
	}

	show(): void {
		const menuEl = document.createElement('div');
		menuEl.className = 'menu ml-playground-menu';
		for (const item of this._items) {
			const button = document.createElement('button');
			button.type = 'button';
			button.textContent = item.title;
			button.addEventListener('click', () => {
				item.callback();
				menuEl.remove();
			});
			menuEl.appendChild(button);
		}
		document.body.appendChild(menuEl);
	}

	hide(): void {
		document.querySelector('.ml-playground-menu')?.remove();
	}
}

export const Platform = {
	isMobile: false,
	isDesktop: true,
	isMacOS: false,
	isWin: false,
	isLinux: true,
	isIosApp: false,
	isAndroidApp: false,
};

function toastContainer(): HTMLElement {
	let container = document.getElementById('mnemoloop-playground-toasts');
	if (!container) {
		container = document.createElement('div');
		container.id = 'mnemoloop-playground-toasts';
		container.className = 'ml-playground-toasts';
		document.body.appendChild(container);
	}
	return container;
}

export class Notice {
	message: string;
	readonly noticeEl: HTMLElement;
	private _timeout: number | null;

	constructor(message: string, timeout = 5000) {
		this.message = message;
		this.noticeEl = document.createElement('div');
		this.noticeEl.className = 'ml-playground-toast';
		this.noticeEl.textContent = message;
		this.noticeEl.addEventListener('click', () => this.hide());
		toastContainer().appendChild(this.noticeEl);
		this._timeout = timeout > 0 ? window.setTimeout(() => this.hide(), timeout) : null;
	}

	setMessage(message: string): void {
		this.message = message;
		this.noticeEl.textContent = message;
	}

	hide(): void {
		if (this._timeout !== null) {
			window.clearTimeout(this._timeout);
			this._timeout = null;
		}
		this.noticeEl.remove();
	}
}

const DEFAULT_ICON_SIZE = 16;

const customIcons = new Map<string, string>();

/** Mirrors Obsidian's `addIcon` registry so plugin-registered icons resolve. */
export function addIcon(iconId: string, svgContent: string): void {
	customIcons.set(iconId, svgContent);
}

export function setIcon(element: HTMLElement, iconId: string): void {
	element.textContent = '';
	const inner = customIcons.get(iconId) ?? LUCIDE_ICON_NODES[iconId];
	if (!inner) return;

	const svg = document.createElementNS(SVG_NS, 'svg');
	svg.setAttribute('xmlns', SVG_NS);
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('width', String(DEFAULT_ICON_SIZE));
	svg.setAttribute('height', String(DEFAULT_ICON_SIZE));
	svg.setAttribute('fill', 'none');
	svg.setAttribute('stroke', 'currentColor');
	svg.setAttribute('stroke-width', '2');
	svg.setAttribute('stroke-linecap', 'round');
	svg.setAttribute('stroke-linejoin', 'round');
	svg.setAttribute('class', `svg-icon lucide lucide-${iconId}`);
	svg.setAttribute('data-icon', iconId);
	svg.setAttribute('aria-hidden', 'true');
	svg.innerHTML = inner;
	element.appendChild(svg);
}

export function getLinkpath(linktext: string): string {
	return linktext.split('#')[0].split('|')[0];
}

export function normalizePath(path: string): string {
	let normalized = path.replace(/\\/g, '/').trim().replace(/\/{2,}/g, '/');
	if (normalized.length > 1 && normalized.endsWith('/')) {
		normalized = normalized.slice(0, -1);
	}
	return normalized === '' ? '/' : normalized;
}

function parseScalar(raw: string): unknown {
	const value = raw.trim();
	if (!value) return '';
	try {
		return JSON.parse(value);
	} catch {
		if (
			(value.startsWith("'") && value.endsWith("'")) ||
			(value.startsWith('"') && value.endsWith('"'))
		) {
			return value.slice(1, -1);
		}
		return value;
	}
}

function parseFlatYaml(yaml: string): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const line of yaml.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const separator = trimmed.indexOf(':');
		if (separator <= 0) continue;
		result[trimmed.slice(0, separator).trim()] = parseScalar(trimmed.slice(separator + 1));
	}
	return result;
}

/**
 * Supports the flat frontmatter the fixtures use plus JSON blocks (JSON is a
 * YAML subset), which is how occlusion fixtures and serialized occlusion
 * content are represented.
 */
export function parseYaml(yaml: string): unknown {
	const trimmed = yaml.trim();
	if (!trimmed) return null;
	if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
		try {
			return JSON.parse(trimmed);
		} catch {
			/* fall through to the flat parser */
		}
	}
	return parseFlatYaml(trimmed);
}

export function stringifyYaml(value: unknown): string {
	return JSON.stringify(value);
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function renderInline(text: string): string {
	return escapeHtml(text)
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function renderMarkdown(markdown: string, target: HTMLElement): void {
	const blocks = markdown.split(/\n{2,}/);
	const html = blocks
		.map((block) => {
			const lines = block.split('\n');
			const heading = /^(#{1,6})\s+(.*)$/.exec(lines[0]);
			if (heading) {
				const level = heading[1].length;
				return `<h${level}>${renderInline(heading[2])}</h${level}>`;
			}
			if (lines.every((line) => /^\s*[-*+]\s+/.test(line))) {
				const items = lines
					.map((line) => `<li>${renderInline(line.replace(/^\s*[-*+]\s+/, ''))}</li>`)
					.join('');
				return `<ul>${items}</ul>`;
			}
			return `<p>${lines.map(renderInline).join('<br>')}</p>`;
		})
		.join('');
	target.insertAdjacentHTML('beforeend', html);
}

export const MarkdownRenderer = {
	async render(
		_app: unknown,
		markdown: string,
		element: HTMLElement,
		_sourcePath: string,
		_component: unknown,
	): Promise<void> {
		renderMarkdown(markdown, element);
	},
	renderer(_app: unknown, markdown: string, element: HTMLElement): void {
		renderMarkdown(markdown, element);
	},
};

export { installObsidianDomExtensions };

/* eslint-enable @typescript-eslint/no-explicit-any */
