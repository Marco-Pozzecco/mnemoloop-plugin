import { BaseCommand } from '@/modules/commands/BaseCommand';
import {
	EventBus,
	FlashcardWriterCreateRequestEvent,
	FlashcardWriterCreateResponseEvent,
} from '@/modules/events';
import { openInSplitMode } from '@/utils/Workspace';
import { Menu, TAbstractFile, TFile, WorkspaceLeaf, normalizePath } from 'obsidian';

export class CreateFlashcardFromFileCommand extends BaseCommand {
	readonly id = 'create-empty-in-panel';
	readonly name = 'Create flashcard from file';
	private _unsubscribe?: () => void;

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

		const responseHandler = async (event: FlashcardWriterCreateResponseEvent) => {
			this._unsubscribe?.();
			const path = normalizePath(event.data.filepath);
			const targetFile = this.plugin.app.vault.getFileByPath(path);
			if (!targetFile) {
				return;
			}
			const rootLeaves: WorkspaceLeaf[] = [];
			this.plugin.app.workspace.iterateRootLeaves((leaf) => {
				rootLeaves.push(leaf);
			});
			const leaf = openInSplitMode(this.plugin.app.workspace);
			await leaf.openFile(targetFile);
			if (sourceLeaf) {
				this.plugin.app.workspace.revealLeaf(sourceLeaf);
			}
		};

		this._unsubscribe = EventBus.instance.subscribe(
			FlashcardWriterCreateResponseEvent,
			responseHandler,
		);

		EventBus.instance.publish(
			new FlashcardWriterCreateRequestEvent({
				back: '',
				front: '',
				source: sourcePath,
			}),
		);
	}

	override onUnregister(): void {
		this._unsubscribe?.();
	}
}
