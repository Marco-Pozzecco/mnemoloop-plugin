import { ICommand, ICommandDependencies } from '@/interfaces/ICommand';
import { CommandKey, Commands } from '@/types/commands';

export class CommandRegistry {
	private commands: Commands = new Map();

	register(key: CommandKey, command: ICommand): void {
		if (this.commands.has(key)) {
			throw new Error(`Command with key "${key}" is already registered`);
		}
		this.commands.set(key, command as Commands extends Map<CommandKey, infer V> ? V : never);
	}

	initialize(deps: ICommandDependencies): void {
		this.commands.forEach((command) => {
			command.register(deps);
		});
	}

	unregisterAll(): void {
		this.commands.forEach((command) => {
			if (command.unregister) {
				command.unregister();
			}
		});
		this.commands.clear();
	}

	getCommand<K extends CommandKey>(
		key: K,
	): Commands extends Map<K, infer V> ? V | undefined : never {
		return this.commands.get(key) as Commands extends Map<K, infer V> ? V | undefined : never;
	}

	hasCommand(key: CommandKey): boolean {
		return this.commands.has(key);
	}
}
