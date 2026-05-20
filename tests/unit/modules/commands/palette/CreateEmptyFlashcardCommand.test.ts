import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CreateEmptyFlashcardCommand } from '@/modules/commands/palette/CreateEmptyFlashcardCommand';
import { EventBus } from '@/modules/events/core/EventBus';
import { FlashcardWriterCreateRequestEvent } from '@/modules/events';
import { resetSingletons } from '../../../../helpers/reset-singletons';
import { createMockPlugin } from '../../../../helpers/mock-obsidian';

describe('CreateEmptyFlashcardCommand', () => {
	beforeEach(() => {
		resetSingletons();
	});

	function setup() {
		const cmd = new CreateEmptyFlashcardCommand();
		const plugin = createMockPlugin();
		const addCommandSpy = vi.spyOn(plugin, 'addCommand');
		cmd.register({
			plugin: plugin as any,
			adapters: new Map() as any,
			indexes: new Map() as any,
			parsers: new Map() as any,
		});
		return { cmd, plugin, addCommandSpy };
	}

	it('should register command with correct id and name', () => {
		const { addCommandSpy } = setup();
		expect(addCommandSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'create-empty-flashcard',
				name: 'Create empty flashcard',
			}),
		);
	});

	it('should publish FlashcardWriterCreateRequestEvent with active file path', () => {
		const { plugin, addCommandSpy } = setup();
		const publishSpy = vi.spyOn(EventBus.instance, 'publish');
		plugin.app.workspace.getActiveFile = vi.fn().mockReturnValue({ path: 'notes/test.md' });

		const callback = (addCommandSpy.mock.calls[0][0] as { callback: () => unknown }).callback;
		callback();

		expect(publishSpy).toHaveBeenCalledTimes(1);
		const event = publishSpy.mock.calls[0][0] as FlashcardWriterCreateRequestEvent;
		expect(event.type).toBe(FlashcardWriterCreateRequestEvent.type);
		expect(event.data).toEqual({
			back: '',
			front: '',
			source: 'notes/test.md',
		});
	});

	it('should publish event with empty source when no active file', () => {
		const { plugin, addCommandSpy } = setup();
		const publishSpy = vi.spyOn(EventBus.instance, 'publish');
		plugin.app.workspace.getActiveFile = vi.fn().mockReturnValue(null);

		const callback = (addCommandSpy.mock.calls[0][0] as { callback: () => unknown }).callback;
		callback();

		expect(publishSpy).toHaveBeenCalledTimes(1);
		const event = publishSpy.mock.calls[0][0] as FlashcardWriterCreateRequestEvent;
		expect(event.data.source).toBe('');
		expect(event.data.front).toBe('');
		expect(event.data.back).toBe('');
	});
});
