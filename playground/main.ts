import './base.css';
import './theme.css';
import '@/ui/styles/main.scss';

import { mount } from 'svelte';
import { Platform } from 'obsidian';
import { bootPlayground, openRequestedModal, prepareView } from './boot';
import { resolveFixture } from './fixtures';
import { createDiv, createEl, installObsidianDomExtensions } from './obsidian/dom';
import { applyTheme, readParams } from './routes';
import Playground from './Playground.svelte';

installObsidianDomExtensions();

function renderBootError(target: HTMLElement, error: unknown): void {
	const message = error instanceof Error ? error.stack ?? error.message : String(error);
	target.replaceChildren();
	const box = createDiv();
	box.className = 'ml-playground-boot-error';
	const title = createEl('h2');
	title.textContent = 'Playground failed to boot';
	const detail = createEl('pre');
	detail.className = 'ml-playground-boot-error-detail';
	detail.textContent = message;
	box.append(title, detail);
	target.appendChild(box);
}

async function main(): Promise<void> {
	const params = readParams(window.location.search);
	applyTheme(params.theme);
	Platform.isMobile = params.platform === 'mobile';

	const target = document.getElementById('mnemoloop-playground');
	if (!target) throw new Error('Missing #mnemoloop-playground root element');

	try {
		const fixture = resolveFixture(params.fixture);
		const stack = await bootPlayground(fixture);
		await prepareView(stack, params);
		mount(Playground, { target, props: { stack, fixture, params } });
		openRequestedModal(stack, params);
	} catch (error) {
		console.error('[playground] Failed to boot', error);
		renderBootError(target, error);
	}
}

void main();
