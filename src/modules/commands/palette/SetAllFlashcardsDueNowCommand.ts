import { BaseCommand } from '@/modules/commands/BaseCommand';
import { IndexKey } from '@/types/indexes';
import { ParserKey } from '@/types/parsers';
import { FlashcardWriter } from '@/modules/writers/FlashcardWriter';
import { FlashcardParser } from '@/modules/parsers/FlashcardParser';
import { Notice } from 'obsidian';
import { env } from '@/env';

export class SetAllFlashcardsDueNowCommand extends BaseCommand {
	readonly id = 'set-all-flashcards-due-now';
	readonly name = 'Set all flashcards due to now [DEBUG]';

	protected onRegister(): void {
		if (env.mode === 'production') {
			return;
		}
		this.plugin.addCommand({
			id: this.id,
			name: this.name,
			callback: async () => {
				await this.execute();
			},
		});
	}

	private async execute(): Promise<void> {
		const flashcardIndex = this.indexes.get(IndexKey.flashcard);
		const parser = this.parsers.get(ParserKey.flashcard);

		if (!flashcardIndex || !parser) {
			new Notice('Error: Flashcard dependencies not found');
			return;
		}

		const allFlashcards = flashcardIndex.getAll();

		if (allFlashcards.length === 0) {
			new Notice('No flashcards found');
			return;
		}

		// Create writer instance to update frontmatter in files
		const writer = new FlashcardWriter(this.plugin, parser as FlashcardParser);
		const now = new Date().toISOString();
		let updatedCount = 0;

		try {
			for (const flashcard of allFlashcards) {
				// Update in index (FlashcardMetadata has due and updated_at)
				flashcardIndex.update(flashcard.uuid, {
					...flashcard,
					due: now,
					updated_at: now,
				});

				// Update in actual file (FlashcardYaml only has due, not updated_at)
				await writer.updateFrontmatter(flashcard.file, {
					due: now,
				});

				updatedCount++;
			}

			// Save index changes
			await flashcardIndex.save();

			new Notice(`Updated ${updatedCount} flashcard(s) due date to now`);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`Error updating flashcards: ${message}`);
			console.error('SetAllFlashcardsDueNowCommand error:', error);
		}
	}
}
