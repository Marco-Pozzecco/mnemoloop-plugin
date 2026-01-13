import { Notice, Plugin } from 'obsidian';
import { ICommandDefinition, CommandResult, ICommandRegistry } from './contracts/ICommandRegistry';

export class CommandRegistry implements ICommandRegistry {
	private plugin: Plugin | null = null;
	private commands: Map<string, ICommandDefinition> = new Map();

	initialize(plugin: Plugin): void {
		this.plugin = plugin;
	}

	registerCommand(command: ICommandDefinition): void {
		if (this.commands.has(command.id)) {
			throw new Error(`Command with id '${command.id}' is already registered`);
		}

		this.commands.set(command.id, command);

		if (this.plugin) {
			this.plugin.addCommand({
				id: command.id,
				name: command.name,
				checkCallback: command.checkCallback ? () => this.canExecute(command.id) : undefined,
				callback: async () => {
					const result = await this.executeCommand(command.id);
					if (result.success && result.message) {
						new Notice(result.message);
					} else if (!result.success) {
						new Notice(result.error);
					}
				},
			});
		}
	}

	unregisterCommand(commandId: string): void {
		if (!this.commands.has(commandId)) {
			throw new Error(`Command with id '${commandId}' is not registered`);
		}

		this.commands.delete(commandId);

		if (this.plugin) {
			this.plugin.removeCommand(commandId);
		}
	}

	async executeCommand(commandId: string): Promise<CommandResult> {
		const command = this.commands.get(commandId);

		if (!command) {
			return { success: false, error: `Command '${commandId}' not found` };
		}

		try {
			await command.callback();
			return { success: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	canExecute(commandId: string): boolean {
		const command = this.commands.get(commandId);

		if (!command) {
			return false;
		}

		if (command.checkCallback) {
			return command.checkCallback();
		}

		return true;
	}

	updateHotkeys(commandId: string, hotkeys: string[]): void {
		const command = this.commands.get(commandId);

		if (!command) {
			throw new Error(`Command with id '${commandId}' not found`);
		}

		command.hotkeys = hotkeys;
	}

	getRegisteredCommands(): string[] {
		return Array.from(this.commands.keys());
	}
}
