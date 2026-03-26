import { z } from 'zod';
import { FSRSParams } from './srs';
import { DEFAULT_FSRS } from '@/utils/constants';

export enum CardStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
  PAUSED = 'PAUSED',
  STALE = 'STALE',
}

export const FlashcardMetadataSchema = FSRSParams.extend({
  uuid: z.uuid(),
  file: z.string().min(1),
  source: z
    .string()
    .regex(/^\[\[.*\]\]$/, 'Must be valid Obsidian link format')
    .nullable(),
  status: z.enum(CardStatus),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  deleted_at: z.iso.datetime().nullable(),
});

export const FlashcardBodySchema = z.object({
  front: z.string(),
  back: z.string()
})

export const FlashcardSchema = FlashcardMetadataSchema
  .extend(FlashcardBodySchema.shape)
  .refine(
    (data) => {
      const created = new Date(data.created_at).getTime();
      const updated = new Date(data.updated_at).getTime();
      return updated >= created;
    },
    {
      message: 'updated timestamp must be >= created timestamp',
    },
  );

export const FlashcardIndexSchema = z.object({
  flashcards: FlashcardSchema.array(),
  updated_at: z.iso.datetime().nullable()
})

export type FlashcardIndex = z.infer<typeof FlashcardIndexSchema>;
export type FlashcardMetadata = z.infer<typeof FlashcardMetadataSchema>;
export type FlashcardBody = z.infer<typeof FlashcardBodySchema>;
export type Flashcard = z.infer<typeof FlashcardSchema>;

export const DEFAULT_FLASHCARD_METADATA: Omit<FlashcardMetadata, 'uuid' | "file"> = {
  source: null,
  status: CardStatus.ACTIVE,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
  ...DEFAULT_FSRS
}
