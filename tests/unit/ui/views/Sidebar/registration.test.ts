import { describe, expect, it, vi } from 'vitest';
import MnemoloopPlugin from '@/main';
import { SIDEBAR_VIEW } from '@/ui/views/Sidebar/constants';
import { createMockPlugin } from '../../../../helpers/mock-obsidian';

/**
 * `initializeViews` is private, so it is exercised on a prototype-backed plugin
 * instance with the Obsidian registration calls spied — the same shape the
 * occlusion integration test uses to reach `main.ts`.
 */
function createPlugin() {
	const plugin = Object.create(MnemoloopPlugin.prototype) as MnemoloopPlugin;
	Object.assign(plugin, {
		app: createMockPlugin().app,
		manifest: { name: 'Mnemoloop' },
		registerView: vi.fn(),
		registerHoverLinkSource: vi.fn(),
		addSettingTab: vi.fn(),
	});
	return plugin as MnemoloopPlugin & { registerView: ReturnType<typeof vi.fn> };
}

describe('plugin view registration', () => {
	it('registers the flashcard sidebar view type', () => {
		const plugin = createPlugin();
		(plugin as unknown as { initializeViews: () => void }).initializeViews();

		expect(plugin.registerView).toHaveBeenCalledWith(SIDEBAR_VIEW, expect.any(Function));
	});
});
