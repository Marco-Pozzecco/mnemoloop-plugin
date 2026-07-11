import { BaseCommand } from '@/modules/commands/BaseCommand';
import { EventBus, FlashcardWriterCreateRequestEvent } from '@/modules/events';
import { CardType } from '@/schemas';

export class CreateEmptyFlashcardCommand extends BaseCommand {
	readonly id = 'create-empty-flashcard';
	readonly name = 'Create empty flashcard';

	protected onRegister(): void {
		this.plugin.addCommand({
			id: this.id,
			name: this.name,
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				await EventBus.instance.publish(
					new FlashcardWriterCreateRequestEvent({
						content: {
							meta_type: CardType.Basic,
							front: '',
							back: '',
						},
						source: activeFile?.path ?? '',
					}),
				);
			},
		});
	}
}
