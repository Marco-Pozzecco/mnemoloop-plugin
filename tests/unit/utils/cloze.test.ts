import { describe, expect, it } from 'vitest';
import { parseClozeContent, renderClozeText } from '@/utils/cloze';

describe('cloze', () => {
	describe('renderClozeText', () => {
		it('puts a placeholder back where each answer was cut out', () => {
			const content = parseClozeContent(
				'Analytics cloze 1: {{c1::retention}} drives the forecast.',
			);

			expect(content.text).toBe('Analytics cloze 1:  drives the forecast.');
			expect(renderClozeText(content)).toBe('Analytics cloze 1: [...] drives the forecast.');
		});

		it('renders one placeholder per position for a repeated deletion', () => {
			const content = parseClozeContent('{{c1::Paris}} and {{c1::Paris}} again.');

			expect(content.deletions).toHaveLength(1);
			expect(renderClozeText(content)).toBe('[...] and [...] again.');
		});

		it('renders a deletion at the very end of the text', () => {
			const content = parseClozeContent('Ends with {{c1::Paris}}');

			expect(renderClozeText(content)).toBe('Ends with [...]');
		});

		it('accepts a custom placeholder', () => {
			const content = parseClozeContent('The capital is {{c1::Paris}}.');

			expect(renderClozeText(content, '___')).toBe('The capital is ___.');
		});

		it('returns the stored text unchanged when there is nothing to mark', () => {
			expect(renderClozeText({ text: 'No deletions', deletions: [] })).toBe('No deletions');
		});
	});
});
