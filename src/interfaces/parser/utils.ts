// Entity parser
export type ParseResult<Entity> = ParseResultWithSuccess<Entity> | ParseResultWithError;
export type ParseResultWithSuccess<Entity> = {
	entity: Entity;
	stats: { created_at: string; updated_at: string };
	filepath: string;
	success: true;
};

export type ParseResultWithError = {
	entity: null;
	stats: null;
	filepath: string;
	success: false;
	error: Error;
};

// Content parser
export type ParseContentResult<Entity> =
	ParseContentResultWithSuccess<Entity> | ParseContentResultWithError;

export type ParseContentResultWithSuccess<Entity> = Omit<
	ParseResultWithSuccess<Entity>,
	'filepath' | 'stats'
>;
export type ParseContentResultWithError = Omit<ParseResultWithError, 'filepath' | 'stats'>;

// Yaml parser
export type RecoverResult<Entity> = RecoverResultSuccess<Entity> | RecoverResultError;
export type RecoverResultSuccess<Entity> = {
	data: Entity;
	success: true;
	warnings?: RecoveryWarning[];
};

export type RecoverResultError = {
	data: null;
	success: false;
};

export interface RecoveryWarning {
	field: string;
	issue: string;
}
