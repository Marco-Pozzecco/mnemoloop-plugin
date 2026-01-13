import { Hotkey, Plugin } from 'obsidian';

/**
 * Command definition
 */
export interface ICommandDefinition {
	id: string;
	name: string;
	callback: () => Promise<void> | void;
	checkCallback?: () => boolean;
	hotkeys?: Hotkey[];
}

/**
 * Command execution result
 */
export type CommandResult = { success: true; message?: string } | { success: false; error: string };

/**
 * Command registry interface
 */
export interface ICommandRegistry {
	/**
	 * Initialize command registry and register all commands
	 * @param plugin - Obsidian plugin  instance
	 */
	initialize(plugin: Plugin): void;

	/**
	 * Register a single command
	 * @param command - Command definition to register
	 */
	registerCommand(command: ICommandDefinition): void;

	/**
	 * Unregister a command by ID
	 * @param commandId - ID of command to unregister
	 */
	unregisterCommand(commandId: string): void;

	/**
	 * Execute a command by ID
	 * @param commandId - ID of command to execute
	 * @returns Execution result
	 */
	executeCommand(commandId: string): Promise<CommandResult>;

	/**
	 * Check if a command can be executed
	 * @param commandId - ID of command to check
	 */
	canExecute(commandId: string): boolean;

	/**
	 * Update command hotkeys (from settings)
	 * @param commandId - Command ID
	 * @param hotkeys - New hotkey bindings
	 */
	updateHotkeys(commandId: string, hotkeys: Hotkey[]): void;

	/**
	 * Get all registered command IDs
	 */
	getRegisteredCommands(): string[];
}
