import { z } from 'zod';

export const ParseResultSchema = z.object({
	success: z.boolean(),
	flashcard: z.any().optional(),
	error: z.string().optional(),
});

export const YamlParseResultSchema = z.object({
	success: z.boolean(),
	metadata: z.any().optional(),
	error: z.string().optional(),
	warnings: z.array(z.string()).optional(),
});

export const ContentSplitResultSchema = z.object({
	success: z.boolean(),
	front: z.string().optional(),
	back: z.string().optional(),
	error: z.string().optional(),
});

export const ParserSettingsSchema = z.object({
	flashcard_directory: z.string().min(1).default('/flashcards/'),
	marker: z.string().min(1).max(10).default('?'),
});
