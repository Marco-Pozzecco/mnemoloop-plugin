<script lang="ts">
	import type { FsrsConfig } from '@/schemas/settings';
	import type { FSRSParameters, Grade } from 'ts-fsrs';
	import { createEmptyCard, FSRS, generatorParameters, Rating } from 'ts-fsrs';
	import { getIntervalPreview } from './utils';

	let { config }: { config: FsrsConfig } = $props();
	let nIntervals = $state(5);

	const preview = $derived(() => {
		const fsrs = new FSRS(generatorParameters(config as Omit<FSRSParameters, 'w'>));
		const card = createEmptyCard(new Date());
		const now = new Date();

		return [
			{ label: 'Again', rating: Rating.Again },
			{ label: 'Hard', rating: Rating.Hard },
			{ label: 'Good', rating: Rating.Good },
			{ label: 'Easy', rating: Rating.Easy },
		].map(({ label, rating }) => {
			const intervals = getIntervalPreview(fsrs, card, now, rating as Grade, nIntervals).map(
				(interval, index) => ({ interval, key: `${rating}-${index}` }),
			);
			return {
				rating: label,
				intervals,
				key: `${rating}${intervals.join('')}`,
			};
		});
	});
</script>

<div class="ml-fsrs-preview">
	<h4 class="ml-fsrs-preview__title">Interval preview</h4>
	<table class="ml-fsrs-preview__table">
		<thead>
			<tr>
				<th>Rating</th>
				{#each Array.from({ length: 5 }, (_, i) => i + 1) as i (i)}
					<th>Review {i}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each preview() as row (row.key)}
				<tr>
					<td>{row.rating}</td>
					{#each row.intervals as interval (interval.key)}
						<td>{interval.interval}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.ml-fsrs-preview {
		margin-top: 1rem;
	}

	.ml-fsrs-preview__title {
		color: var(--text-normal);
		margin: 0 0 0.5rem 0;
		font-size: var(--font-ui-small);
		font-weight: 600;
		padding: 0;
	}

	.ml-fsrs-preview__table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--font-ui-small);
	}

	.ml-fsrs-preview__table th,
	.ml-fsrs-preview__table td {
		padding: 0.5rem;
		text-align: left;
		border-bottom: 1px solid var(--background-modifier-border);
		color: var(--text-normal);
	}

	.ml-fsrs-preview__table th {
		font-weight: 600;
		color: var(--text-muted);
	}
</style>
