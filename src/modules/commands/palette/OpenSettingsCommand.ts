import { BaseCommand } from '@/modules/commands/BaseCommand';

export class OpenSettingsCommand extends BaseCommand {
	readonly id = 'open-settings';
	readonly name = 'Open Settings';

	protected onRegister(): void {
		this.plugin.addCommand({
			id: this.id,
			name: this.name,
			callback: async () => {
				// Settings are opened via the settings tab, no additional action needed
			},
		});
	}
}
