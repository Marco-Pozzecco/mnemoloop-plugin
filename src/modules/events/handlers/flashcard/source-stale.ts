import type { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { CardStatus } from '@/schemas';
import { IndexKey } from '@/types/indexes';
import { Notice } from 'obsidian';
import { EventHandler } from '../../core/EventHandler';
import {
	FlashcardIndexUpdateRequestEvent,
	FlashcardWriterUpdateRequestEvent,
	FlashcardWriterUpdateResponseEvent,
} from '../../domains/flashcard';
import { VaultModifyEvent } from '../../domains/vault';

export class FlashcardStaleOnSourceNoteModifyHandler extends EventHandler<VaultModifyEvent> {
	constructor(deps: IEventRegistryDependencies) {
		super(deps);
	}

	async handle(event: VaultModifyEvent): Promise<void> {
		if (event.data.entity !== 'source_note') {
			return;
		}

		const indexer = this._indexers.get(IndexKey.flashcard)!;

		const file = this._plugin.app.vault.getFileByPath(event.data.path);

		if (!file) {
			return;
		}

		const sourceLink = `[[${file.basename}]]`;
		const matchedCards = indexer.query(
			(card) => card.source === sourceLink && card.status === CardStatus.ACTIVE,
		);

		let staleCount = 0;

		for (const card of matchedCards) {
			if (card.status === CardStatus.STALE) {
				continue;
			}

			if (!(await this._writeStaleStatus(card.uuid))) {
				continue;
			}

			await this._bus.publish(
				new FlashcardIndexUpdateRequestEvent({ uuid: card.uuid, status: CardStatus.STALE }),
			);
			staleCount += 1;
		}

		if (staleCount === 0) {
			return;
		}

		const cardLabel = staleCount === 1 ? 'flashcard' : 'flashcards';
		new Notice(`${staleCount} ${cardLabel} became stale`);
	}

	private async _writeStaleStatus(uuid: string): Promise<boolean> {
		const request = new FlashcardWriterUpdateRequestEvent({ uuid, status: CardStatus.STALE });

		return await new Promise<boolean>((resolve) => {
			const unsubscribe = this._bus.subscribe(
				FlashcardWriterUpdateResponseEvent,
				async (response) => {
					if (response.data.requestId !== request.id) {
						return;
					}
					unsubscribe();
					resolve(response.data.success);
				},
			);

			void this._bus.publish(request);
		});
	}
}
