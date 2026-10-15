import { default as BasicContent } from './Basic/component.svelte';
import { default as SequenceContent } from './Sequence/component.svelte';
import { default as QuizContent } from './Quiz/component.svelte';
import { default as ClozeContent } from './Cloze/component.svelte';
import { default as OcclusionContent } from './Occlusion/component.svelte';

export default {
	Basic: BasicContent,
	Sequence: SequenceContent,
	Quiz: QuizContent,
	Cloze: ClozeContent,
	Occlusion: OcclusionContent,
};
