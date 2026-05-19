import { BaseCommand } from '@/modules/commands/BaseCommand';
import { APP_VIEW } from '@/ui/views/App/AppView';

export class OpenDashboardCommand extends BaseCommand {
	readonly id = 'open-dashboard';
	readonly name = 'Open Dashboard';

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
		let leaf = workspace.getLeavesOfType(APP_VIEW)[0];

		if (!leaf) {
			leaf = workspace.getLeaf(false);
			await leaf.setViewState({ type: APP_VIEW, active: true });
		}

		workspace.revealLeaf(leaf);
	}
}
