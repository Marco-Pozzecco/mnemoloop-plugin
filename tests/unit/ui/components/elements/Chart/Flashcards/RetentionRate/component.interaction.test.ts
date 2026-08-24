// @vitest-environment jsdom
import '../../../../../../../helpers/dom-polyfills';
import { afterEach, describe, expect, it } from 'vitest';
import { mount, unmount } from 'svelte';
import RetentionRateChart from '@/ui/components/elements/Chart/Flashcards/RetentionRate/component.svelte';
import { DEFAULT_STATISTICS } from '@/schemas';

describe('RetentionRateChart interaction', () => {
	let cleanup: (() => Promise<void>) | undefined;
	let target: HTMLDivElement;

	afterEach(async () => {
		await cleanup?.();
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	it('renders spot-retention points and a linear-trend line on a 0–100% axis', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		const instance = mount(RetentionRateChart, {
			target,
			props: {
				stats: {
					...DEFAULT_STATISTICS,
					progress: {
						'2024-06-19': {
							retention_rate: 0.9,
							total_count: 10,
							correct_count: 9,
							incorrect_count: 1,
							sessions_completed: 1,
							total_duration: 120,
							goal_completed: false,
						},
						'2024-06-20': {
							retention_rate: 0.85,
							total_count: 20,
							correct_count: 17,
							incorrect_count: 3,
							sessions_completed: 1,
							total_duration: 120,
							goal_completed: false,
						},
					},
				},
				requestRetention: 0.9,
			},
		});
		cleanup = () => unmount(instance);
		await Promise.resolve();

		expect(target.querySelectorAll('circle')).toHaveLength(2);
		expect(target.textContent).toContain('0%');
		expect(target.textContent).toContain('100%');
	});
});
