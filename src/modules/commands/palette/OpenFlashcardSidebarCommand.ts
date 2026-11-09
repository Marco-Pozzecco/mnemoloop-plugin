import { BaseCommand } from '@/modules/commands/BaseCommand';
import { revealFlashcardSidebar } from '@/ui/views/Sidebar/activate';

export class OpenFlashcardSidebarCommand extends BaseCommand {
	readonly id = 'open-flashcard-sidebar';
	readonly name = 'Open flashcard sidebar';

	protected onRegister(): void {
		this.plugin.addCommand({
			id: this.id,
			name: this.name,
			callback: async () => {
				await revealFlashcardSidebar(this.plugin.app);
			},
		});
	}
}
