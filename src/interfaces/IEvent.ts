export interface IEvent<TData = unknown> {
	readonly id: string;
	readonly type: string;
	readonly time: Date;
	readonly data: TData;

	isType(type: string): boolean;
	toJSON(): { type: string; data: TData; timestamp: string };
}
