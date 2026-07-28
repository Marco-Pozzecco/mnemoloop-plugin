import { BaseCommand } from '@/modules/commands/BaseCommand';
import { modalStore, ModalViewEnum } from '@/ui/store/modal.store';
import { SvelteModal } from '@/ui/views/Modal/ModalView';
import { ModalClassNames } from '@/ui/views/Modal/types';

export class CreateFlashcardModalCommand extends BaseCommand {
	readonly id = 'create-flashcard-modal';
	readonly name = 'Create flashcard';

	protected onRegister(): void {
		this.plugin.addCommand({
			id: this.id,
			name: this.name,
			callback: () => {
				modalStore.open(ModalViewEnum.flashcard, { mode: 'create' });
				const modal = new SvelteModal(this.plugin.app, ModalClassNames.flashcard);
				modal.open();
			},
		});
	}
}
