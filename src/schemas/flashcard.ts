import { z } from 'zod';
import { FSRSParams } from './srs';

export enum CardStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
  PAUSED = 'PAUSED',
  STALE = 'STALE',
}

export const FlashcardMetadataSchema = z.object({
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
  srs: FSRSParams,
});

export const FlashcardSchema = FlashcardMetadataSchema.extend({
  front: z.string().min(0),
  back: z.string().min(0),
}).refine(
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

export type FlashcardMetadata = z.infer<typeof FlashcardMetadataSchema>;
export type FlashcardIndex = z.infer<typeof FlashcardIndexSchema>;
export type Flashcard = z.infer<typeof FlashcardSchema>;
