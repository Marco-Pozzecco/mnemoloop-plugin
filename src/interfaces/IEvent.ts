export interface IEvent<TData = unknown> {
	readonly id: string;
	readonly time: Date;
	readonly data: TData;
	readonly type: string;

	isType(type: string): boolean;
	toJSON(): { type: string; data: TData; timestamp: string };
}
