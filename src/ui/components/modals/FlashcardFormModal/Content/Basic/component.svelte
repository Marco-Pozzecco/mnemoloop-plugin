<script lang="ts">
	import type { FlashcardBaseContent, FlashcardContent } from '@/schemas';
	import { CardType } from '@/schemas';
	import { Input } from '@/ui/components/elements';
	import type ContentTypeProps from '../types';
	import type { BuildContentFn, ValidateFn } from '../types';

	let { mode, initialContent, onRegister }: ContentTypeProps = $props();

	// --- Form state ---
	let front = $state('');
	let back = $state('');

	// --- Init from parent data (edit mode only) ---
	$effect(() => {
		if (mode === 'edit' && initialContent) {
			const c = initialContent as FlashcardBaseContent;
			front = c.front;
			back = c.back;
		}
	});

	// --- Register validate + buildContent with parent ---
	$effect(() => {
		const validate: ValidateFn = () => {
			if (!front.trim()) return 'Front is required.';
			if (!back.trim()) return 'Back is required.';
			return null;
		};
		const buildContent: BuildContentFn = () =>
			({ meta_type: CardType.Basic, front: front.trim(), back: back.trim() }) as FlashcardContent;
		onRegister({ validate, buildContent });
	});
</script>

<Input label="Front" value={front} required onchange={(v) => (front = v)} />
<Input label="Back" value={back} required onchange={(v) => (back = v)} />
