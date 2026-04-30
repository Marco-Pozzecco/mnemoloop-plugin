import { IEvent } from '@/interfaces/IEvent';
import { BaseCommand } from '@/modules/commands/BaseCommand';
import {
	EventBus,
	FlashcardWriterCreateRequestEvent,
	FlashcardWriterCreateResponseEvent,
} from '@/modules/events';
import { Menu, TAbstractFile, TFile, WorkspaceLeaf, normalizePath } from 'obsidian';

export class CreateFlashcardFromFileCommand extends BaseCommand {
	readonly id = 'ka-create-empty-in-panel';
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
						.setIcon('brain')
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

			let leaf: WorkspaceLeaf;

			if (rootLeaves.length > 1) {
				const rightLeaf = rootLeaves[rootLeaves.length - 1];
				leaf = this.plugin.app.workspace.createLeafInParent(rightLeaf.parent, -1);
			} else {
				leaf = this.plugin.app.workspace.getLeaf('split');
			}

			await leaf.openFile(file);
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
