import z from 'zod';

export const EventLogEntrySchema = z.object({
	id: z.string(),
	time: z.string(),
	type: z.string(),
	data: z.unknown(),
});

export type EventLogEntry = z.infer<typeof EventLogEntrySchema>;

export const EventLogSchema = z.object({
	events: z.array(EventLogEntrySchema),
});

export type EventLog = z.infer<typeof EventLogSchema>;
