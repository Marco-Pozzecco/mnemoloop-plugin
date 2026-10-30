import { BaseCommand } from '@/modules/commands/BaseCommand';
import type { WorkspaceLeaf } from 'obsidian';
import { SIDEBAR_VIEW } from '@/ui/views/Sidebar/constants';

export class OpenFlashcardSidebarCommand extends BaseCommand {
	readonly id = 'open-flashcard-sidebar';
	readonly name = 'Open flashcard sidebar';

	protected onRegister(): void {
		this.plugin.addCommand({
			id: this.id,
			name: this.name,
			callback: async () => {
				await this.activateView();
			},
		});
	}

	private async activateView(): Promise<void> {
		const { workspace } = this.plugin.app;
		let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(SIDEBAR_VIEW)[0] ?? null;

		if (!leaf) {
			leaf = workspace.getRightLeaf(false);
			if (!leaf) return;
			await leaf.setViewState({ type: SIDEBAR_VIEW, active: true });
		}

		await workspace.revealLeaf(leaf);
	}
}
