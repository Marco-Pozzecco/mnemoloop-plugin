import type { FlashcardClozeContent } from '@/schemas';

export type ClozeDeletion = FlashcardClozeContent['deletions'][number];

interface ClozeOccurrence {
	deletion: ClozeDeletion;
	position: number;
	deletionIndex: number;
	positionIndex: number;
}

function escapeHtmlAttribute(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function placeholderMarkup(id: string, isActive: boolean): string {
	const className = isActive
		? 'ml-cloze-placeholder ml-cloze-placeholder-active'
		: 'ml-cloze-placeholder';

	return `<span class="${escapeHtmlAttribute(className)}" data-cloze-id="${escapeHtmlAttribute(id)}" role="button" tabindex="0">[...]</span>`;
}

/**
 * Builds the Markdown string used by the Cloze renderer.
 *
 * Source text and answers intentionally remain untouched so Obsidian owns all
 * Markdown parsing. Unrevealed deletions are represented by escaped HTML
 * attributes on a small placeholder span that the host delegates interactions
 * to after MarkdownRenderer has created the DOM.
 */
export function buildClozeMarkdown(
	content: Pick<FlashcardClozeContent, 'text' | 'deletions'>,
	revealedIds: ReadonlySet<string>,
	isAnswerShowing: boolean,
	highlightedId: string | null,
): string {
	const occurrences: ClozeOccurrence[] = [];

	content.deletions.forEach((deletion, deletionIndex) => {
		deletion.positions.forEach((position, positionIndex) => {
			occurrences.push({ deletion, position, deletionIndex, positionIndex });
		});
	});

	occurrences.sort(
		(a, b) =>
			a.position - b.position ||
			a.deletionIndex - b.deletionIndex ||
			a.positionIndex - b.positionIndex,
	);

	let cursor = 0;
	let result = '';
	for (const occurrence of occurrences) {
		const position = Math.max(0, Math.min(occurrence.position, content.text.length));
		if (position > cursor) {
			result += content.text.slice(cursor, position);
		}

		if (isAnswerShowing || revealedIds.has(occurrence.deletion.id)) {
			result += occurrence.deletion.answer;
		} else {
			result += placeholderMarkup(
				occurrence.deletion.id,
				occurrence.deletion.id === highlightedId,
			);
		}

		cursor = position;
	}

	return result + content.text.slice(cursor);
}
