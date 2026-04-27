import { BaseCommand } from '@/modules/commands/BaseCommand';
import { EventBus } from '@/modules/event-bus/EventBus';
import { EventType, FlashcardCreateRequestEvent } from '@/types/events';

export class CreateEmptyFlashcardCommand extends BaseCommand {
	readonly id = 'ka-create-empty-flashcard';
	readonly name = 'Create Empty Flashcard';

	protected onRegister(): void {
		this.plugin.addCommand({
			id: this.id,
			name: this.name,
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				const event: FlashcardCreateRequestEvent = {
					created_at: new Date(),
					event_type: EventType.FlashcardCreateRequest,
					data: {
						front: '',
						back: '',
						deck: '',
						source: activeFile?.path ?? '',
					},
				};

				EventBus.instance.publish(event);
			},
		});
	}
}
