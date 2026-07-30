<script lang="ts">
	import { v4 as uuid } from 'uuid';
	import { Textarea } from '@/ui/components/elements';
	import type { FlashcardClozeContent, FlashcardContent } from '@/schemas';
	import { CardType, FlashcardClozeRegex } from '@/schemas';
	import type ContentTypeProps from '../types';
	import type { BuildContentFn, ValidateFn } from '../types';

	let { mode, initialContent, onRegister, disabled = false }: ContentTypeProps = $props();

	// --- Form state ---
	const clozePlaceholder =
		'Enter text with {{c1::answer}} markers, e.g. "The capital of {{c1::France}} is {{c2::Paris}}"';
	let clozeText = $state('');

	// --- Cloze helper ---
	function reconstructClozeText(
		text: string,
		deletions: FlashcardClozeContent['deletions'],
	): string {
		const sorted = [...deletions].sort((a, b) => b.positions[0] - a.positions[0]);
		let result = text;
		let idx = sorted.length;
		for (const del of sorted) {
			const pos = del.positions[0];
			const answer = del.answer;
			const hint = del.hint ? `::${del.hint}` : '';
			const marker = `{{c${idx}::${answer}${hint}}}`;
			result = result.slice(0, pos) + marker + result.slice(pos + answer.length);
			idx--;
		}
		return result;
	}

	// --- Init from parent data (edit mode only) ---
	$effect(() => {
		if (mode === 'edit' && initialContent) {
			const c = initialContent as FlashcardClozeContent;
			clozeText = reconstructClozeText(c.text, c.deletions);
		}
	});

	// --- Register validate + buildContent with parent ---
	$effect(() => {
		const validate: ValidateFn = () => {
			const matches = [...clozeText.matchAll(FlashcardClozeRegex)];
			if (matches.length === 0) return 'At least one {{c1::answer}} marker is required.';
			return null;
		};
		const buildContent: BuildContentFn = () => {
			const deletions: FlashcardClozeContent['deletions'] = [];
			const regex = new RegExp(FlashcardClozeRegex.source, FlashcardClozeRegex.flags);
			let match: RegExpExecArray | null;
			while ((match = regex.exec(clozeText)) !== null) {
				deletions.push({
					id: uuid(),
					answer: match[2],
					hint: match[3] ?? null,
					positions: [match.index],
				});
			}
			return { meta_type: CardType.Cloze, text: clozeText, deletions } as FlashcardContent;
		};
		onRegister({ validate, buildContent });
	});
</script>

<Textarea
	label="Text"
	placeholder={clozePlaceholder}
	value={clozeText}
	required
	rows={5}
	maxLength={10000}
	{disabled}
	onchange={(v) => (clozeText = v)}
/>

