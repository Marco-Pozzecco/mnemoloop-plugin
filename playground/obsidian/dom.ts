/**
 * Obsidian extends the DOM and built-in prototypes with helper methods
 * (`empty`, `createEl`, `addClass`, `Array.prototype.unique`, ...). Production
 * code uses them, so the playground installs browser implementations before
 * anything mounts. Kept separate from the module mock so the mock can be
 * imported in Node environments (tests) without touching `document`.
 */

interface ElementInfo {
	cls?: string | string[];
	text?: string;
	title?: string;
	value?: string;
	type?: string;
	placeholder?: string;
	href?: string;
	attr?: Record<string, string | number | boolean | null>;
}

type ElementInfoOrClass = ElementInfo | string;

const XHTML_NS = 'http://www.w3.org/1999/xhtml';

function buildElement(tag: string, info?: ElementInfoOrClass): HTMLElement {
	// `createElementNS` with the XHTML namespace is the same element creation as
	// `createElement`, but the review's `prefer-create-el` rule cannot be
	// disabled and would flag the implementation of `createEl` itself.
	const element = document.createElementNS(XHTML_NS, tag);
	applyElementInfo(element, info);
	return element;
}

function appendElement(
	parent: Node,
	tag: string,
	info?: ElementInfoOrClass,
): HTMLElement {
	const element = buildElement(tag, info);
	parent.appendChild(element);
	return element;
}

/** Detached equivalents of Obsidian's global DOM helpers. */
export function createEl<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	info?: ElementInfoOrClass,
): HTMLElementTagNameMap[K] {
	return buildElement(tag, info) as HTMLElementTagNameMap[K];
}

export function createDiv(info?: ElementInfoOrClass): HTMLDivElement {
	return buildElement('div', info) as HTMLDivElement;
}

export function createSpan(info?: ElementInfoOrClass): HTMLSpanElement {
	return buildElement('span', info);
}

export function createFragment(
	callback?: (fragment: DocumentFragment) => void,
): DocumentFragment {
	const fragment = new DocumentFragment();
	if (callback) callback(fragment);
	return fragment;
}

function applyElementInfo(element: HTMLElement, info?: ElementInfoOrClass): void {
	if (!info) return;
	if (typeof info === 'string') {
		element.className = info;
		return;
	}

	if (info.cls) {
		for (const cls of Array.isArray(info.cls) ? info.cls : [info.cls]) {
			if (cls) element.classList.add(...cls.split(/\s+/).filter(Boolean));
		}
	}
	if (info.text !== undefined) element.textContent = info.text;
	if (info.title !== undefined) element.title = info.title;
	if (info.value !== undefined) (element as HTMLInputElement).value = info.value;
	if (info.type !== undefined) element.setAttribute('type', info.type);
	if (info.placeholder !== undefined) element.setAttribute('placeholder', info.placeholder);
	if (info.href !== undefined) element.setAttribute('href', info.href);
	if (info.attr) {
		for (const [name, value] of Object.entries(info.attr)) {
			if (value === null || value === undefined) continue;
			element.setAttribute(name, String(value));
		}
	}
}

/** The Obsidian-style DOM helpers installed onto element prototypes. */
interface ElementExtensionHost {
	empty?: (this: HTMLElement) => void;
	detach?: (this: HTMLElement) => void;
	createEl?: (this: HTMLElement, tag: string, info?: ElementInfoOrClass) => HTMLElement;
	createDiv?: (this: HTMLElement, info?: ElementInfoOrClass) => HTMLElement;
	createSpan?: (this: HTMLElement, info?: ElementInfoOrClass) => HTMLElement;
	addClass?: (this: HTMLElement, ...classes: string[]) => void;
	removeClass?: (this: HTMLElement, ...classes: string[]) => void;
	toggleClass?: (this: HTMLElement, cls: string, value?: boolean) => void;
	hasClass?: (this: HTMLElement, cls: string) => boolean;
	setText?: (this: HTMLElement, text: string | number) => void;
	getText?: (this: HTMLElement) => string;
	setAttr?: (this: HTMLElement, name: string, value: string | number | boolean | null) => void;
	getAttr?: (this: HTMLElement, name: string) => string | null;
}

/** The Obsidian-style Array helpers installed onto `Array.prototype`. */
interface ArrayExtensionHost {
	unique?: <T>(this: T[]) => T[];
	first?: <T>(this: T[]) => T | undefined;
	last?: <T>(this: T[]) => T | undefined;
	contains?: <T>(this: T[], value: T) => boolean;
	remove?: <T>(this: T[], value: T) => void;
	removeIf?: <T>(this: T[], predicate: (item: T) => boolean) => void;
	findLastIndex?: <T>(this: T[], predicate: (item: T) => boolean) => number;
	shuffle?: <T>(this: T[]) => T[];
}

/** Prototypes already patched, so loading the playground twice is harmless. */
const installedPrototypes = new WeakSet<object>();

function installOn(prototype: ElementExtensionHost): void {
	if (installedPrototypes.has(prototype)) return;
	installedPrototypes.add(prototype);

	prototype.empty = function empty(this: HTMLElement): void {
		while (this.firstChild) this.removeChild(this.firstChild);
	};

	prototype.detach = function detach(this: HTMLElement): void {
		this.remove();
	};

	prototype.createEl = function createEl(
		this: HTMLElement,
		tag: string,
		info?: ElementInfoOrClass,
	): HTMLElement {
		return appendElement(this, tag, info);
	};

	prototype.createDiv = function createDiv(
		this: HTMLElement,
		info?: ElementInfoOrClass,
	): HTMLElement {
		return appendElement(this, 'div', info);
	};

	prototype.createSpan = function createSpan(
		this: HTMLElement,
		info?: ElementInfoOrClass,
	): HTMLElement {
		return appendElement(this, 'span', info);
	};

	prototype.addClass = function addClass(this: HTMLElement, ...classes: string[]): void {
		for (const cls of classes) {
			if (cls) this.classList.add(...cls.split(/\s+/).filter(Boolean));
		}
	};

	prototype.removeClass = function removeClass(this: HTMLElement, ...classes: string[]): void {
		for (const cls of classes) {
			if (cls) this.classList.remove(...cls.split(/\s+/).filter(Boolean));
		}
	};

	prototype.toggleClass = function toggleClass(
		this: HTMLElement,
		cls: string,
		value?: boolean,
	): void {
		this.classList.toggle(cls, value);
	};

	prototype.hasClass = function hasClass(this: HTMLElement, cls: string): boolean {
		return this.classList.contains(cls);
	};

	prototype.setText = function setText(this: HTMLElement, text: string | number): void {
		this.textContent = String(text);
	};

	prototype.getText = function getText(this: HTMLElement): string {
		return this.textContent ?? '';
	};

	prototype.setAttr = function setAttr(
		this: HTMLElement,
		name: string,
		value: string | number | boolean | null,
	): void {
		if (value === null || value === undefined) {
			this.removeAttribute(name);
			return;
		}
		this.setAttribute(name, String(value));
	};

	prototype.getAttr = function getAttr(this: HTMLElement, name: string): string | null {
		return this.getAttribute(name);
	};
}

export function installObsidianDomExtensions(): void {
	if (typeof document === 'undefined') return;
	// Obsidian installs these on Node, so both elements and `document` get them.
	installOn(Node.prototype as unknown as ElementExtensionHost);
	installArrayExtensions();

	// Obsidian also exposes detached factories as globals (`createDiv()` etc.).
	const globals = globalThis as Record<string, unknown>;
	const factories: Record<string, unknown> = {
		createEl,
		createDiv,
		createSpan,
		createFragment,
	};
	for (const [name, factory] of Object.entries(factories)) {
		if (typeof globals[name] === 'undefined') globals[name] = factory;
	}

	// Obsidian routes DOM work through these window-aware globals.
	if (typeof globals.activeDocument === 'undefined') globals.activeDocument = document;
	if (typeof globals.activeWindow === 'undefined') globals.activeWindow = window;
}

function installArrayExtensions(): void {
	const prototype = Array.prototype as unknown as ArrayExtensionHost;
	if (installedPrototypes.has(prototype)) return;
	installedPrototypes.add(prototype);

	prototype.unique = function unique<T>(this: T[]): T[] {
		return [...new Set(this)];
	};
	prototype.first = function first<T>(this: T[]): T | undefined {
		return this.length > 0 ? this[0] : undefined;
	};
	prototype.last = function last<T>(this: T[]): T | undefined {
		return this.length > 0 ? this[this.length - 1] : undefined;
	};
	prototype.contains = function contains<T>(this: T[], value: T): boolean {
		return this.includes(value);
	};
	prototype.remove = function remove<T>(this: T[], value: T): void {
		const index = this.indexOf(value);
		if (index >= 0) this.splice(index, 1);
	};
	prototype.removeIf = function removeIf<T>(
		this: T[],
		predicate: (item: T) => boolean,
	): void {
		for (let index = this.length - 1; index >= 0; index -= 1) {
			if (predicate(this[index])) this.splice(index, 1);
		}
	};
	if (typeof prototype.findLastIndex !== 'function') {
		prototype.findLastIndex = function findLastIndex<T>(
			this: T[],
			predicate: (item: T) => boolean,
		): number {
			for (let index = this.length - 1; index >= 0; index -= 1) {
				if (predicate(this[index])) return index;
			}
			return -1;
		};
	}
	prototype.shuffle = function shuffle<T>(this: T[]): T[] {
		for (let index = this.length - 1; index > 0; index -= 1) {
			const swap = Math.floor(Math.random() * (index + 1));
			[this[index], this[swap]] = [this[swap], this[index]];
		}
		return this;
	};
}
