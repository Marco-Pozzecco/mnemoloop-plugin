import './base.css';
import './theme.css';
import '@/ui/styles/main.scss';

import { mount } from 'svelte';
import { Platform } from 'obsidian';
import { bootPlayground, openRequestedModal, prepareView } from './boot';
import { resolveFixture } from './fixtures';
import { installObsidianDomExtensions } from './obsidian/dom';
import { applyTheme, readParams } from './routes';
import Playground from './Playground.svelte';

installObsidianDomExtensions();

function renderBootError(target: HTMLElement, error: unknown): void {
	const message = error instanceof Error ? error.stack ?? error.message : String(error);
	target.innerHTML = '';
	const box = document.createElement('div');
	box.style.cssText =
		'margin: 24px; padding: 16px; border: 1px solid var(--background-modifier-error); border-radius: 8px; font-family: var(--font-interface);';
	const title = document.createElement('h2');
	title.textContent = 'Playground failed to boot';
	const detail = document.createElement('pre');
	detail.style.whiteSpace = 'pre-wrap';
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
