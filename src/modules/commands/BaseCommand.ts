import { ICommand, ICommandDependencies } from '@/interfaces/ICommand';

export abstract class BaseCommand implements ICommand {
	abstract readonly id: string;
	abstract readonly name: string;

	protected deps?: ICommandDependencies;

	register(deps: ICommandDependencies): void {
		this.deps = deps;
		this.onRegister();
	}

	unregister(): void {
		this.onUnregister();
		this.deps = undefined;
	}

	protected abstract onRegister(): void;

	protected onUnregister(): void {
		// Override in subclasses if cleanup is needed
	}

	protected get plugin() {
		if (!this.deps) {
			throw new Error('Command dependencies not initialized');
		}
		return this.deps.plugin;
	}

	protected get adapters() {
		if (!this.deps) {
			throw new Error('Command dependencies not initialized');
		}
		return this.deps.adapters;
	}

	protected get indexes() {
		if (!this.deps) {
			throw new Error('Command dependencies not initialized');
		}
		return this.deps.indexes;
	}

	protected get parsers() {
		if (!this.deps) {
			throw new Error('Command dependencies not initialized');
		}
		return this.deps.parsers;
	}
}
