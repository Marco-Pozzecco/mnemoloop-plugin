// @vitest-environment jsdom
import '../../helpers/dom-polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import { Component, Platform, parseYaml } from 'obsidian';
import {
	FlashcardAdapterInitEvent,
	FlashcardIndexInitEvent,
	SettingsAdapterInitEvent,
	StatisticsAdapterInitEvent,
} from '@/modules/events';
import { sidebarStore } from '@/ui/store/sidebar.store';
import SidebarPanel from '@/ui/views/Sidebar/component.svelte';
import { FIXTURES } from '../../../playground/fixtures';
import { parseYaml as playgroundParseYaml } from '../../../playground/obsidian/index';
import { buildRealStack, type RealStack } from '../../helpers/real-stack';

// Align the Obsidian YAML codec with the playground's parser so the fixture boots
// exactly as it does in the browser.
vi.mocked(parseYaml).mockImplementation((yaml: string) => playgroundParseYaml(yaml));

const SIDEBAR_NOTE = 'notes/biology.md';

async function flush(): Promise<void> {
	await Promise.resolve();
	await tick();
	await Promise.resolve();
	await tick();
}

/** Boots the sidebar fixture and mounts the real panel against it. */
async function mountFixture(): Promise<{
	stack: RealStack;
	target: HTMLDivElement;
	instance: ReturnType<typeof mount>;
}> {
	const fixture = FIXTURES.sidebar;
	const stack = await buildRealStack(fixture.documents);
	await stack.bus.publish(new FlashcardAdapterInitEvent());
	await stack.bus.publish(new SettingsAdapterInitEvent());
	await stack.bus.publish(new StatisticsAdapterInitEvent());
	await stack.bus.publish(new FlashcardIndexInitEvent());

	const note = stack.vault.files.get(SIDEBAR_NOTE);
	expect(note, 'fixture note exists').toBeDefined();
	stack.plugin.app.workspace.setActiveFile(note);

	const target = document.createElement('div');
	document.body.appendChild(target);
	const instance = mount(SidebarPanel, {
		target,
		props: { app: stack.plugin.app, component: new Component() },
	});
	await flush();
	return { stack, target, instance };
}

function newCardButton(target: HTMLElement): HTMLButtonElement {
	const button = Array.from(target.querySelectorAll<HTMLButtonElement>('button')).find((element) =>
		element.textContent?.includes('New card'),
	);
	if (!button) throw new Error('No New card button');
	return button;
}

describe('flashcard sidebar playground path', () => {
	let stack: RealStack | undefined;
	let target: HTMLDivElement | undefined;
	let instance: ReturnType<typeof mount> | undefined;

	afterEach(async () => {
		if (instance) await unmount(instance);
		instance = undefined;
		target?.remove();
		document.body.innerHTML = '';
		stack?.dispose();
		stack = undefined;
		sidebarStore.reset();
		(Platform as unknown as { isMobile: boolean }).isMobile = false;
	});

	it('renders the fixture note and its linked cards', async () => {
		const mounted = await mountFixture();
		stack = mounted.stack;
		target = mounted.target;
		instance = mounted.instance;

		expect(target.querySelector('.ml-sidebar__source-name')?.textContent).toBe('biology');
		const labels = Array.from(target.querySelectorAll<HTMLElement>('.ml-sidebar-group__label')).map(
			(header) => header.textContent,
		);
		expect(labels).toEqual(['Stale', 'Active', 'Paused']);
	});

	for (const isMobile of [false, true]) {
		it(`renders the create form in the panel (isMobile: ${isMobile})`, async () => {
			(Platform as unknown as { isMobile: boolean }).isMobile = isMobile;
			const mounted = await mountFixture();
			stack = mounted.stack;
			target = mounted.target;
			instance = mounted.instance;

			newCardButton(target).click();
			await flush();

			expect(target.querySelector('.ml-flashcard-form')).not.toBeNull();
			expect(target.querySelector('.ml-sidabar-flashcard')).toBeNull();
			const source = Array.from(target.querySelectorAll<HTMLInputElement>('input')).find((input) =>
				input.value.startsWith('[['),
			);
			expect(source?.value).toBe(`[[${SIDEBAR_NOTE}]]`);
		});
	}
});
