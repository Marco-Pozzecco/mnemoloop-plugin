import type { z } from 'zod';

export type FormValues<TSchema extends z.ZodType> = z.infer<TSchema>;

/** Errors are keyed by the field path's first segment, plus any custom field. */
export type FormErrors = Record<string, string>;

/**
 * Minimal schema-backed form state.
 *
 * It owns the values, the field errors and the submitting flag; it does not
 * know about components, events or the vault. Domain forms compose it and add
 * their own fields or submit path.
 */
export class Form<TSchema extends z.ZodType> {
	readonly schema: TSchema;
	values = $state<FormValues<TSchema>>() as FormValues<TSchema>;
	errors = $state<FormErrors>({});
	isSubmitting = $state(false);

	constructor(schema: TSchema, initialValues: FormValues<TSchema>) {
		this.schema = schema;
		this.values = initialValues;
	}

	/** The first error, for surfaces that show one alert instead of per-field text. */
	get error(): string | null {
		return Object.values(this.errors)[0] ?? null;
	}

	setValue<K extends keyof FormValues<TSchema>>(key: K, value: FormValues<TSchema>[K]): void {
		(this.values as Record<string, unknown>)[String(key)] = value;
		this.clearError(String(key));
	}

	setError(key: string, message: string | null): void {
		if (!message) {
			this.clearError(key);
			return;
		}
		this.errors = { ...this.errors, [key]: message };
	}

	clearError(key: string): void {
		if (!(key in this.errors)) return;
		const next = { ...this.errors };
		delete next[key];
		this.errors = next;
	}

	clearErrors(): void {
		this.errors = {};
	}

	/** Validate the current values, or a payload built from them. */
	validate(payload: FormValues<TSchema> = this.values): boolean {
		const result = this.schema.safeParse(payload);
		if (result.success) {
			this.errors = {};
			return true;
		}

		this.errors = mapIssues(result.error);
		return false;
	}

	/**
	 * Validate, then run the handler with the submitting flag set. A failed
	 * validation returns null without calling the handler.
	 */
	async submit<TResult>(
		handler: (values: FormValues<TSchema>) => Promise<TResult>,
		payload: FormValues<TSchema> = this.values,
	): Promise<TResult | null> {
		if (this.isSubmitting || !this.validate(payload)) return null;

		this.isSubmitting = true;
		try {
			return await handler(payload);
		} finally {
			this.isSubmitting = false;
		}
	}
}

function mapIssues(error: z.ZodError): FormErrors {
	const errors: FormErrors = {};
	for (const issue of error.issues) {
		const key = issue.path[0] === undefined ? 'form' : String(issue.path[0]);
		if (!(key in errors)) errors[key] = issue.message;
	}
	return errors;
}
