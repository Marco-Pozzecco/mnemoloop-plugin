import { BaseCommand } from '@/modules/commands/BaseCommand';
import { sidebarStore } from '@/ui/store/sidebar.store';
import { revealFlashcardSidebar } from '@/ui/views/Sidebar/activate';
import { Menu, TAbstractFile, TFile } from 'obsidian';

export class CreateFlashcardFromFileCommand extends BaseCommand {
	readonly id = 'create-flashcard-from-file';
	readonly name = 'Create flashcard from file';

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
						.setIcon('file-plus')
						.onClick(() => this.openCreate(file));
				});
			},
		);

		this.plugin.registerEvent(eventRef);
	}

	/** Reveal the panel first: no request is left behind when it cannot open. */
	private async openCreate(file: TFile): Promise<void> {
		const leaf = await revealFlashcardSidebar(this.plugin.app);
		if (!leaf) return;
		sidebarStore.requestCreate(`[[${file.path}]]`);
	}
}
