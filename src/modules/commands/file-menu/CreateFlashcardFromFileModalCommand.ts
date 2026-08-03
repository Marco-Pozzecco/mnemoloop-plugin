import { BaseCommand } from '@/modules/commands/BaseCommand';
import { modalStore, ModalViewEnum } from '@/ui/store/modal.store';
import { SvelteModal } from '@/ui/views/Modal/ModalView';
import { ModalClassNames } from '@/ui/views/Modal/types';
import { Menu, TAbstractFile, TFile } from 'obsidian';

export class CreateFlashcardFromFileModalCommand extends BaseCommand {
	readonly id = 'create-flashcard-from-file-modal';
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
						.onClick(() => {
							modalStore.open(ModalViewEnum.flashcard, {
								mode: 'create',
								prefillSource: `[[${file.path}]]`,
							});
							const modal = new SvelteModal(
								this.plugin.app,
								ModalClassNames.flashcard,
							);
							modal.open();
						});
				});
			},
		);

		this.plugin.registerEvent(eventRef);
	}
}
