import { BaseCommand } from '@/modules/commands/BaseCommand';
import { EventBus, FlashcardWriterCreateRequestEvent } from '@/modules/events';

export class CreateEmptyFlashcardCommand extends BaseCommand {
	readonly id = 'create-empty-flashcard';
	readonly name = 'Create Empty Flashcard';

	protected onRegister(): void {
		this.plugin.addCommand({
			id: this.id,
			name: this.name,
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				EventBus.instance.publish(
					new FlashcardWriterCreateRequestEvent({
						back: '',
						front: '',
						source: activeFile?.path ?? '',
					}),
				);
			},
		});
	}
}
