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

function createElement(
	parent: HTMLElement,
	tag: string,
	info?: ElementInfoOrClass,
): HTMLElement {
	const element = document.createElement(tag);
	applyElementInfo(element, info);
	parent.appendChild(element);
	return element;
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

/* eslint-disable @typescript-eslint/no-explicit-any -- DOM prototype augmentation is untyped by nature. */
function installOn(prototype: any): void {
	if (prototype.__mnemoloopDomExtensions) return;
	Object.defineProperty(prototype, '__mnemoloopDomExtensions', {
		value: true,
		enumerable: false,
	});

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
		return createElement(this, tag, info);
	};

	prototype.createDiv = function createDiv(
		this: HTMLElement,
		info?: ElementInfoOrClass,
	): HTMLElement {
		return createElement(this, 'div', info);
	};

	prototype.createSpan = function createSpan(
		this: HTMLElement,
		info?: ElementInfoOrClass,
	): HTMLElement {
		return createElement(this, 'span', info);
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
/* eslint-enable @typescript-eslint/no-explicit-any */

export function installObsidianDomExtensions(): void {
	if (typeof document === 'undefined') return;
	installOn(HTMLElement.prototype);
	installOn(Element.prototype);
	installArrayExtensions();

	// Obsidian routes DOM work through these window-aware globals.
	const globals = globalThis as Record<string, unknown>;
	if (typeof globals.activeDocument === 'undefined') globals.activeDocument = document;
	if (typeof globals.activeWindow === 'undefined') globals.activeWindow = window;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Obsidian augments globals; the implementations are untyped. */
function installArrayExtensions(): void {
	const prototype = Array.prototype as any;
	if (prototype.__mnemoloopArrayExtensions) return;
	Object.defineProperty(prototype, '__mnemoloopArrayExtensions', {
		value: true,
		enumerable: false,
	});

	prototype.unique = function unique(this: unknown[]): unknown[] {
		return [...new Set(this)];
	};
	prototype.first = function first(this: unknown[]): unknown {
		return this.length > 0 ? this[0] : undefined;
	};
	prototype.last = function last(this: unknown[]): unknown {
		return this.length > 0 ? this[this.length - 1] : undefined;
	};
	prototype.contains = function contains(this: unknown[], value: unknown): boolean {
		return this.includes(value);
	};
	prototype.remove = function remove(this: unknown[], value: unknown): void {
		const index = this.indexOf(value);
		if (index >= 0) this.splice(index, 1);
	};
	prototype.removeIf = function removeIf(
		this: unknown[],
		predicate: (item: unknown) => boolean,
	): void {
		for (let index = this.length - 1; index >= 0; index -= 1) {
			if (predicate(this[index])) this.splice(index, 1);
		}
	};
	if (typeof prototype.findLastIndex !== 'function') {
		prototype.findLastIndex = function findLastIndex(
			this: unknown[],
			predicate: (item: unknown) => boolean,
		): number {
			for (let index = this.length - 1; index >= 0; index -= 1) {
				if (predicate(this[index])) return index;
			}
			return -1;
		};
	}
	prototype.shuffle = function shuffle(this: unknown[]): unknown[] {
		for (let index = this.length - 1; index > 0; index -= 1) {
			const swap = Math.floor(Math.random() * (index + 1));
			[this[index], this[swap]] = [this[swap], this[index]];
		}
		return this;
	};
}
/* eslint-enable @typescript-eslint/no-explicit-any */
