import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Menu, TAbstractFile, TFile } from 'obsidian';
import { CreateFlashcardFromFileCommand } from '@/modules/commands/file-menu/CreateFlashcardFromFileCommand';
import { sidebarStore } from '@/ui/store/sidebar.store';
import { SIDEBAR_VIEW } from '@/ui/views/Sidebar/constants';
import { createMockMenu, createMockPlugin } from '../../../../helpers/mock-obsidian';

type FileMenuListener = (menu: Menu, file: TAbstractFile) => void;

function markdownFile(path: string, basename: string): TFile {
	return new (TFile as unknown as new (path: string, basename: string) => TFile)(path, basename);
}

describe('CreateFlashcardFromFileCommand', () => {
	beforeEach(() => {
		sidebarStore.reset();
	});

	function setup() {
		const command = new CreateFlashcardFromFileCommand();
		const plugin = createMockPlugin();
		command.register({
			plugin: plugin as never,
			adapters: new Map() as never,
			indexes: new Map() as never,
			parsers: new Map() as never,
			writers: new Map() as never,
		});
		const listener = plugin.app.workspace.on.mock.calls[0][1] as FileMenuListener;
		return { plugin, listener };
	}

	function clickItem(
		listener: FileMenuListener,
		file: TAbstractFile,
	): { menu: ReturnType<typeof createMockMenu>; onClick: () => Promise<void> } {
		const menu = createMockMenu();
		listener(menu, file);
		const onClick = menu._items[0].onClick.mock.calls[0][0] as () => Promise<void>;
		return { menu, onClick };
	}

	it('registers a file-menu listener', () => {
		const { plugin } = setup();

		expect(plugin.app.workspace.on).toHaveBeenCalledWith('file-menu', expect.any(Function));
		expect(plugin.registerEvent).toHaveBeenCalledOnce();
	});

	it('adds the item for a markdown file', () => {
		const { listener } = setup();
		const menu = createMockMenu();

		listener(menu, markdownFile('notes/biology.md', 'biology'));

		expect(menu._items).toHaveLength(1);
		expect(menu._items[0].setTitle).toHaveBeenCalledWith('Create flashcard from file');
		expect(menu._items[0].setIcon).toHaveBeenCalledWith('file-plus');
	});

	it('does not add the item for a non-markdown file', () => {
		const { listener } = setup();
		const menu = createMockMenu();

		listener(menu, markdownFile('attachments/diagram.png', 'diagram'));

		expect(menu.addItem).not.toHaveBeenCalled();
	});

	it('reveals the sidebar and requests the create form for the file', async () => {
		const { plugin, listener } = setup();
		const existingLeaf = { setViewState: vi.fn() };
		plugin.app.workspace.getLeavesOfType.mockReturnValue([existingLeaf]);
		plugin.app.workspace.revealLeaf.mockResolvedValue(undefined);

		const { onClick } = clickItem(listener, markdownFile('notes/biology.md', 'biology'));
		await onClick();

		expect(plugin.app.workspace.getLeavesOfType).toHaveBeenCalledWith(SIDEBAR_VIEW);
		expect(plugin.app.workspace.revealLeaf).toHaveBeenCalledWith(existingLeaf);
		expect(sidebarStore.state.pendingCreate?.source).toBe('[[notes/biology.md]]');
	});

	it('leaves no create request behind when the sidebar cannot open', async () => {
		const { plugin, listener } = setup();
		plugin.app.workspace.getLeavesOfType.mockReturnValue([]);
		plugin.app.workspace.getRightLeaf.mockReturnValue(null);

		const { onClick } = clickItem(listener, markdownFile('notes/biology.md', 'biology'));
		await onClick();

		expect(sidebarStore.state.pendingCreate).toBeNull();
	});
});
