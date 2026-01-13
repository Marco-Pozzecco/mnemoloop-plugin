import { z } from 'zod';

export const CachedMetadataSchema = z.object({
  frontmatter: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).optional(),
  links: z.array(z.object({
    link: z.string(),
    original: z.string(),
  })).optional(),
});
