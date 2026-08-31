// @vitest-environment jsdom
import '../../../../../helpers/dom-polyfills'; // MUST be first import
import { afterEach, describe, expect, it } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import CollapsibleHarness from './CollapsibleHarness.svelte';

describe('Collapsible primitive interaction', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount>;

	afterEach(() => {
		if (instance) unmount(instance);
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	it('renders a closed root and collapsed trigger by default', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(CollapsibleHarness, { target });
		await tick();

		const root = target.querySelector<HTMLElement>('[data-testid="collapsible-root"]');
		const trigger = target.querySelector<HTMLButtonElement>('.ml-collapsible__trigger');

		expect(root?.getAttribute('data-state')).toBe('closed');
		expect(trigger?.getAttribute('aria-expanded')).toBe('false');
	});

	it('updates the bound state and content after one trigger click', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(CollapsibleHarness, { target });
		await tick();

		const trigger = target.querySelector<HTMLButtonElement>('.ml-collapsible__trigger');
		trigger?.click();
		await tick();
		await tick();

		const content = target.querySelector<HTMLElement>('.ml-collapsible__content');
		expect(target.querySelector('[data-testid="open"]')?.textContent).toBe('true');
		expect(trigger?.getAttribute('aria-expanded')).toBe('true');
		expect(content?.getAttribute('data-state')).toBe('open');
		expect(content?.classList.contains('ml-collapsible__content')).toBe(true);
		expect(content?.querySelector('.ml-collapsible__content-inner')).toBeTruthy();
	});

	it('keeps the bound state closed when disabled', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(CollapsibleHarness, { target, props: { disabled: true } });
		await tick();

		const trigger = target.querySelector<HTMLButtonElement>('.ml-collapsible__trigger');
		trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
		await tick();

		expect(target.querySelector('[data-testid="open"]')?.textContent).toBe('false');
		expect(trigger?.getAttribute('aria-expanded')).toBe('false');
	});

	it('uses hidden until found while closed and reveals content when opened', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(CollapsibleHarness, { target, props: { hiddenUntilFound: true } });
		await tick();

		const trigger = target.querySelector<HTMLButtonElement>('.ml-collapsible__trigger');
		const content = target.querySelector<HTMLElement>('.ml-collapsible__content');
		expect(content?.getAttribute('hidden')).toBe('until-found');

		trigger?.click();
		await tick();
		await tick();

		expect(content?.getAttribute('data-state')).toBe('open');
		expect(content?.getAttribute('hidden')).toBeNull();
	});
});
