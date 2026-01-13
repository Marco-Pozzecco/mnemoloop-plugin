import { CommandRegistry } from '@/obsidian/CommandRegistry';
import { Plugin } from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('CommandRegistry', () => {
	let commandRegistry: CommandRegistry;
	let mockPlugin: any;

	beforeEach(() => {
		mockPlugin = {
			addCommand: vi.fn(),
			removeCommand: vi.fn(),
		};

		commandRegistry = new CommandRegistry();
		commandRegistry.initialize(mockPlugin);
	});

	describe('Registration', () => {
		it('should register a command', () => {
			const command = {
				id: 'test-command',
				name: 'Test Command',
				callback: vi.fn(),
			};

			commandRegistry.registerCommand(command);

			expect(mockPlugin.addCommand).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'test-command',
					name: 'Test Command',
				}),
			);
			expect(commandRegistry.getRegisteredCommands()).toContain('test-command');
		});

		it('should throw error when registering duplicate command', () => {
			const command = {
				id: 'test-command',
				name: 'Test Command',
				callback: vi.fn(),
			};

			commandRegistry.registerCommand(command);

			expect(() => commandRegistry.registerCommand(command)).toThrow(
				"Command with id 'test-command' is already registered",
			);
		});

		it('should not register with plugin if plugin is null', () => {
			const registryWithoutPlugin = new CommandRegistry();
			registryWithoutPlugin.initialize(null as unknown as Plugin);

			const command = {
				id: 'test-command',
				name: 'Test Command',
				callback: vi.fn(),
			};

			expect(() => registryWithoutPlugin.registerCommand(command)).not.toThrow();
		});

		it('should call plugin.addCommand with checkCallback when provided', () => {
			const checkCallback = vi.fn(() => true);
			const command = {
				id: 'test-command',
				name: 'Test Command',
				callback: vi.fn(),
				checkCallback,
			};

			commandRegistry.registerCommand(command);

			expect(mockPlugin.addCommand).toHaveBeenCalledWith(
				expect.objectContaining({
					checkCallback: expect.any(Function),
				}),
			);

			const addedCommand = mockPlugin.addCommand.mock.calls[0][0];
			addedCommand.checkCallback();

			expect(checkCallback).toHaveBeenCalled();
		});

		it('should register multiple commands', () => {
			const command1 = {
				id: 'command-1',
				name: 'Command 1',
				callback: vi.fn(),
			};
			const command2 = {
				id: 'command-2',
				name: 'Command 2',
				callback: vi.fn(),
			};

			commandRegistry.registerCommand(command1);
			commandRegistry.registerCommand(command2);

			expect(commandRegistry.getRegisteredCommands()).toHaveLength(2);
			expect(commandRegistry.getRegisteredCommands()).toContain('command-1');
			expect(commandRegistry.getRegisteredCommands()).toContain('command-2');
		});
	});

	describe('Execution', () => {
		it('should execute a registered command', async () => {
			const callback = vi.fn();
			const command = {
				id: 'test-command',
				name: 'Test Command',
				callback,
			};

			commandRegistry.registerCommand(command);

			const result = await commandRegistry.executeCommand('test-command');

			expect(callback).toHaveBeenCalled();
			expect(result).toEqual({ success: true });
		});

		it('should return error when executing non-existent command', async () => {
			const result = await commandRegistry.executeCommand('non-existent');

			expect(result).toEqual({
				success: false,
				error: "Command 'non-existent' not found",
			});
		});

		it('should handle async callback errors', async () => {
			const error = new Error('Test error');
			const callback = vi.fn().mockRejectedValue(error);
			const command = {
				id: 'test-command',
				name: 'Test Command',
				callback,
			};

			commandRegistry.registerCommand(command);

			const result = await commandRegistry.executeCommand('test-command');

			expect(result).toEqual({
				success: false,
				error: 'Test error',
			});
		});

		it('should handle sync callback errors', async () => {
			const callback = vi.fn().mockImplementation(() => {
				throw new Error('Sync error');
			});
			const command = {
				id: 'test-command',
				name: 'Test Command',
				callback,
			};

			commandRegistry.registerCommand(command);

			const result = await commandRegistry.executeCommand('test-command');

			expect(result).toEqual({
				success: false,
				error: 'Sync error',
			});
		});

		it('should return success with message when callback completes', async () => {
			const callback = vi.fn();
			const command = {
				id: 'test-command',
				name: 'Test Command',
				callback,
			};

			commandRegistry.registerCommand(command);

			const result = await commandRegistry.executeCommand('test-command');

			expect(result).toEqual({ success: true });
		});

		it('should handle unknown error types', async () => {
			const callback = vi.fn().mockRejectedValue('string error');
			const command = {
				id: 'test-command',
				name: 'Test Command',
				callback,
			};

			commandRegistry.registerCommand(command);

			const result = await commandRegistry.executeCommand('test-command');

			expect(result).toEqual({
				success: false,
				error: 'Unknown error',
			});
		});
	});

	describe('Prerequisite Check', () => {
		it('should return true when command has no checkCallback', () => {
			const command = {
				id: 'test-command',
				name: 'Test Command',
				callback: vi.fn(),
			};

			commandRegistry.registerCommand(command);

			expect(commandRegistry.canExecute('test-command')).toBe(true);
		});

		it('should return true when checkCallback returns true', () => {
			const checkCallback = vi.fn(() => true);
			const command = {
				id: 'test-command',
				name: 'Test Command',
				callback: vi.fn(),
				checkCallback,
			};

			commandRegistry.registerCommand(command);

			expect(commandRegistry.canExecute('test-command')).toBe(true);
			expect(checkCallback).toHaveBeenCalled();
		});

		it('should return false when checkCallback returns false', () => {
			const checkCallback = vi.fn(() => false);
			const command = {
				id: 'test-command',
				name: 'Test Command',
				callback: vi.fn(),
				checkCallback,
			};

			commandRegistry.registerCommand(command);

			expect(commandRegistry.canExecute('test-command')).toBe(false);
			expect(checkCallback).toHaveBeenCalled();
		});

		it('should return false for non-existent command', () => {
			expect(commandRegistry.canExecute('non-existent')).toBe(false);
		});

		it('should call checkCallback each time canExecute is called', () => {
			let callCount = 0;
			const checkCallback = vi.fn(() => {
				callCount++;
				return callCount < 3;
			});
			const command = {
				id: 'test-command',
				name: 'Test Command',
				callback: vi.fn(),
				checkCallback,
			};

			commandRegistry.registerCommand(command);

			expect(commandRegistry.canExecute('test-command')).toBe(true);
			expect(commandRegistry.canExecute('test-command')).toBe(true);
			expect(commandRegistry.canExecute('test-command')).toBe(false);
			expect(checkCallback).toHaveBeenCalledTimes(3);
		});
	});

	describe('Unregister', () => {
		it('should unregister a command', () => {
			const command = {
				id: 'test-command',
				name: 'Test Command',
				callback: vi.fn(),
			};

			commandRegistry.registerCommand(command);
			commandRegistry.unregisterCommand('test-command');

			expect(commandRegistry.getRegisteredCommands()).not.toContain('test-command');
			expect(mockPlugin.removeCommand).toHaveBeenCalledWith('test-command');
		});

		it('should throw error when unregistering non-existent command', () => {
			expect(() => commandRegistry.unregisterCommand('non-existent')).toThrow(
				"Command with id 'non-existent' is not registered",
			);
		});
	});

	describe('Update Hotkeys', () => {
		it('should update command hotkeys', () => {
			const command = {
				id: 'test-command',
				name: 'Test Command',
				callback: vi.fn(),
				hotkeys: [],
			};

			commandRegistry.registerCommand(command);
			commandRegistry.updateHotkeys('test-command', ['Ctrl+R', 'Cmd+R']);

			expect(mockPlugin.removeCommand).toHaveBeenCalledWith('test-command');
			expect(mockPlugin.addCommand).toHaveBeenCalled();
		});

		it('should throw error when updating hotkeys for non-existent command', () => {
			expect(() => commandRegistry.updateHotkeys('non-existent', ['Ctrl+R'])).toThrow(
				"Command with id 'non-existent' not found",
			);
		});
	});

	describe('Get Registered Commands', () => {
		it('should return empty array when no commands registered', () => {
			expect(commandRegistry.getRegisteredCommands()).toEqual([]);
		});

		it('should return all registered command IDs', () => {
			const command1 = {
				id: 'command-1',
				name: 'Command 1',
				callback: vi.fn(),
			};
			const command2 = {
				id: 'command-2',
				name: 'Command 2',
				callback: vi.fn(),
			};

			commandRegistry.registerCommand(command1);
			commandRegistry.registerCommand(command2);

			const commands = commandRegistry.getRegisteredCommands();
			expect(commands).toHaveLength(2);
			expect(commands).toContain('command-1');
			expect(commands).toContain('command-2');
		});
	});
});
