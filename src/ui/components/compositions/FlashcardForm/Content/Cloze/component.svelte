<script lang="ts">
	import { Textarea } from '@/ui/components/elements';
	import type { FlashcardClozeContent } from '@/schemas';
	import type ContentTypeProps from '../types';
	import type { BuildContentFn, ValidateFn } from '../types';
	import { buildClozeContent, validateCloze } from './validation';

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
		const validate: ValidateFn = () => validateCloze(clozeText);
		const buildContent: BuildContentFn = () => buildClozeContent(clozeText);
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

