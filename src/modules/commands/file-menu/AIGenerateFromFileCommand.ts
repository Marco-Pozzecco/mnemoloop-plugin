import { BaseCommand } from '@/modules/commands/BaseCommand';
import { Logger } from '@/utils/Logger';
import { Menu, TAbstractFile, TFile } from 'obsidian';

export class AIGenerateFromFileCommand extends BaseCommand {
	readonly id = 'ka-generate-from-file';
	readonly name = 'Generate flashcards from file';

	protected onRegister(): void {
		const eventRef = this.plugin.app.workspace.on(
			'file-menu',
			(menu: Menu, file: TAbstractFile) => {
				if (!(file instanceof TFile) || file.extension !== 'md') {
					return;
				}

				menu.addItem((item) => {
					item
						.setTitle(this.name)
						.setIcon('sparks')
						.onClick(async () => {
							await this.handleClick(file);
						});
				});
			},
		);

		this.plugin.registerEvent(eventRef);
	}

	private async handleClick(file: TFile): Promise<void> {
		const content = await this.plugin.app.vault.read(file);

		Logger.info('content:', content);
	}
}
