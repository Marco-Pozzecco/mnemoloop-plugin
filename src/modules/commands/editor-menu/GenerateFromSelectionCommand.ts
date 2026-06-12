import { BaseCommand } from '@/modules/commands/BaseCommand';
import { EventBus, FlashcardWriterCreateResponseEvent } from '@/modules/events';
import { modalStore, ModalViewEnum } from '@/ui/store/modal.store';
import { SvelteModal } from '@/ui/views/Modal/ModalView';
import { ModalClassNames } from '@/ui/views/Modal/types';
import { openInSplitMode } from '@/utils/Workspace';
import {
	Editor,
	MarkdownFileInfo,
	MarkdownView,
	Menu,
	normalizePath,
	Notice,
	TFile,
} from 'obsidian';

export class GenerateFromSelectionCommand extends BaseCommand {
	readonly id = 'generate-from-selection';
	readonly name = 'Generate flashcard from selection';
	private _unsubscribe?: () => void;

	protected onRegister(): void {
		const eventRef = this.plugin.app.workspace.on(
			'editor-menu',
			(menu: Menu, editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
				menu.addItem((item) => {
					item
						.setTitle(this.name)
						.setIcon('highlighter')
						.onClick(() => {
							this.handleClick(editor, view);
						});
				});
			},
		);

		this.plugin.registerEvent(eventRef);
	}

	private handleClick(editor: Editor, view: MarkdownView | MarkdownFileInfo): void {
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

		// eslint-disable-next-line @typescript-eslint/require-await
		const responseHandler = async (event: FlashcardWriterCreateResponseEvent) => {
			this._unsubscribe?.();
			const path = normalizePath(event.data.filepath);
			const file = this.plugin.app.vault.getAbstractFileByPath(path);
			if (!(file instanceof TFile)) {
				return;
			}

			const leaf = openInSplitMode(this.plugin.app.workspace);
			void leaf.openFile(file);

			if (view instanceof MarkdownView && view.leaf) {
				void this.plugin.app.workspace.revealLeaf(view.leaf);
			}
		};

		this._unsubscribe = EventBus.instance.subscribe(
			FlashcardWriterCreateResponseEvent,
			responseHandler,
		);

		modalStore.open(ModalViewEnum.flashcard, {
			front: '',
			back: selection,
			deck: '',
			filepath,
		});

		const modal = new SvelteModal(this.plugin.app, ModalClassNames.flashcard);
		modal.open();
	}

	override onUnregister(): void {
		this._unsubscribe?.();
	}
}
