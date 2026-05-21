import { IEvent } from '@/interfaces/IEvent';
import { BaseCommand } from '@/modules/commands/BaseCommand';
import {
	EventBus,
	FlashcardWriterCreateRequestEvent,
	FlashcardWriterCreateResponseEvent,
} from '@/modules/events';
import { openInSplitMode } from '@/utils/Workspace';
import { Menu, TAbstractFile, TFile, WorkspaceLeaf, normalizePath } from 'obsidian';

export class CreateFlashcardFromFileCommand extends BaseCommand {
	readonly id = 'ml-create-empty-in-panel';
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
						.onClick(async () => {
							await this.handleClick(file);
						});
				});
			},
		);

		this.plugin.registerEvent(eventRef);
	}

	private async handleClick(file: TFile): Promise<void> {
		const sourcePath = file.path;
		const sourceLeaf = this.plugin.app.workspace.getMostRecentLeaf();

		const callback = async (evt: IEvent) => {
			if (!evt.isType(FlashcardWriterCreateResponseEvent.type)) {
				return;
			}

			const data = (evt as FlashcardWriterCreateResponseEvent).data;

			const path = normalizePath(data.filepath);
			const file = this.plugin.app.vault.getFileByPath(path);

			if (!file) {
				EventBus.instance.unsubscribe(callback);
				return;
			}

			const rootLeaves: WorkspaceLeaf[] = [];
			this.plugin.app.workspace.iterateRootLeaves((leaf) => {
				rootLeaves.push(leaf);
			});

			const leaf = openInSplitMode(this.plugin.app.workspace);
			await leaf.openFile(file);

			if (sourceLeaf) {
				this.plugin.app.workspace.revealLeaf(sourceLeaf);
			}

			EventBus.instance.unsubscribe(callback);
		};

		EventBus.instance.subscribe(callback);

		EventBus.instance.publish(
			new FlashcardWriterCreateRequestEvent({
				back: '',
				front: '',
				source: sourcePath,
			}),
		);
	}
}
