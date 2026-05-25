import { IEvent } from '@/interfaces/IEvent';
import { BaseCommand } from '@/modules/commands/BaseCommand';
import { EventBus, FlashcardWriterCreateResponseEvent } from '@/modules/events';
import { FlashcardModalData } from '@/ui/components/modals/FlashcardModal/types';
import { modalStore, ModalViewEnum } from '@/ui/store/modal.store';
import { SvelteModal } from '@/ui/views/Modal/ModalView';
import { ModalClassNames } from '@/ui/views/Modal/types';
import { openInSplitMode } from '@/utils/Workspace';
import {
	Editor,
	MarkdownFileInfo,
	MarkdownView,
	Menu,
	Notice,
	normalizePath,
	TFile,
	WorkspaceLeaf,
} from 'obsidian';

export class GenerateFromSelectionCommand extends BaseCommand {
	readonly id = 'ml-generate-from-selection';
	readonly name = 'Generate flashcard from selection';

	protected onRegister(): void {
		const eventRef = this.plugin.app.workspace.on(
			'editor-menu',
			(menu: Menu, editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
				menu.addItem((item) => {
					item
						.setTitle(this.name)
						.setIcon('highlighter')
						.onClick(async () => {
							await this.handleClick(editor, view);
						});
				});
			},
		);

		this.plugin.registerEvent(eventRef);
	}

	private async handleClick(editor: Editor, view: MarkdownView | MarkdownFileInfo): Promise<void> {
		const selection = editor.getSelection();
		const filepath = view.file?.path;

		if (!selection) {
			new Notice('Please select text to generate a flashcard');
			return;
		}

		if (!filepath) {
			new Notice('Impossible to get file path');
			return;
		}

		const callback = async (evt: IEvent) => {
			if (!evt.isType(FlashcardWriterCreateResponseEvent.type)) {
				return;
			}

			EventBus.instance.unsubscribe(callback);

			const data = (evt as FlashcardWriterCreateResponseEvent).data;
			const path = normalizePath(data.filepath);
			const file = this.plugin.app.vault.getAbstractFileByPath(path);
			if (!(file instanceof TFile)) {
				return;
			}

			const leaf = openInSplitMode(this.plugin.app.workspace);
			await leaf.openFile(file);

			if (view instanceof MarkdownView && view.leaf) {
				this.plugin.app.workspace.revealLeaf(view.leaf);
			}
		};

		EventBus.instance.subscribe(callback);

		modalStore.open(ModalViewEnum.flashcard, {
			front: '',
			back: selection,
			deck: '',
			filepath,
		} as FlashcardModalData);

		const modal = new SvelteModal(this.plugin.app, ModalClassNames.flashcard);
		modal.open();
	}
}
