import { Editor, MarkdownFileInfo, MarkdownView, Menu, Notice, TFile } from 'obsidian';
import { BaseCommand } from '@/modules/commands/BaseCommand';
import { EventBus } from '@/modules/event-bus/EventBus';
import { EventData, EventType, FlashcardCreateResEvent } from '@/types/events';
import { FlashcardModalData } from '@/ui/components/modals/FlashcardModal/types';
import { modalStore, ModalViewEnum } from '@/ui/store/modal.store';
import { ModalClassNames } from '@/ui/views/Modal/types';
import { SvelteModal } from '@/ui/views/Modal/ModalView';

export class GenerateFromSelectionCommand extends BaseCommand {
	readonly id = 'ka-generate-from-selection';
	readonly name = 'Generate flashcard from selection';

	protected onRegister(): void {
		const eventRef = this.plugin.app.workspace.on(
			'editor-menu',
			(menu: Menu, editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
				menu.addItem((item) => {
					item
						.setTitle(this.name)
						.setIcon('brain')
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

		const requestId = crypto.randomUUID();

		const callback = (evt: EventData<unknown>) => {
			if (evt.event_type !== EventType.FlashcardCreated) {
				return;
			}

			const data = (evt as FlashcardCreateResEvent).data;

			if (data.requestId !== requestId) {
				return;
			}

			EventBus.instance.unsubscribe(callback);

			const file = this.plugin.app.vault.getAbstractFileByPath(data.filepath);
			if (!(file instanceof TFile)) {
				return;
			}

			const leaf = this.plugin.app.workspace.getRightLeaf(false);
			if (!leaf) {
				return;
			}

			leaf.openFile(file).then(() => {
				if (view instanceof MarkdownView && view.leaf) {
					this.plugin.app.workspace.revealLeaf(view.leaf);
				}
			});
		};

		EventBus.instance.subscribe(callback);

		modalStore.open(ModalViewEnum.flashcard, {
			front: '',
			back: selection,
			deck: '',
			filepath,
			requestId,
		} as FlashcardModalData);

		const modal = new SvelteModal(this.plugin.app, ModalClassNames.flashcard);
		modal.open();
	}
}
