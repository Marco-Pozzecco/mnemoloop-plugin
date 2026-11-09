import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { Form } from '@/ui/forms/Form.svelte';

const Schema = z.object({
	name: z.string().min(1, 'Name is required.'),
	count: z.number().min(1, 'Count must be positive.'),
});

describe('Form', () => {
	it('updates values and clears the field error', () => {
		const form = new Form(Schema, { name: '', count: 0 });

		expect(form.validate()).toBe(false);
		expect(form.errors).toMatchObject({
			name: 'Name is required.',
			count: 'Count must be positive.',
		});

		form.setValue('name', 'Biology');
		expect(form.values.name).toBe('Biology');
		expect(form.errors.name).toBeUndefined();
		expect(form.errors.count).toBe('Count must be positive.');
	});

	it('validates and submits the values once', async () => {
		const form = new Form(Schema, { name: 'Biology', count: 2 });
		const handler = vi.fn().mockResolvedValue('saved');

		await expect(form.submit(handler)).resolves.toBe('saved');
		expect(handler).toHaveBeenCalledWith({ name: 'Biology', count: 2 });
		expect(form.isSubmitting).toBe(false);
	});

	it('does not call the handler when validation fails', async () => {
		const form = new Form(Schema, { name: '', count: 0 });
		const handler = vi.fn();

		await expect(form.submit(handler)).resolves.toBeNull();
		expect(handler).not.toHaveBeenCalled();
		expect(form.isSubmitting).toBe(false);
	});

	it('clears the submitting flag when the handler throws', async () => {
		const form = new Form(Schema, { name: 'Biology', count: 2 });

		await expect(
			form.submit(async () => {
				throw new Error('write failed');
			}),
		).rejects.toThrow('write failed');
		expect(form.isSubmitting).toBe(false);
	});
});
