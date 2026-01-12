import { Index, IndexSchema } from './indexSchema';

export interface Migration {
	version: number;
	migrate(data: any): any;
}

export const migrations: Migration[] = [
	{
		version: 1,
		migrate(data: any): any {
			return data;
		},
	},
];

export function runMigrations(data: any, currentVersion: number, targetVersion: number = 1): Index {
	let result = data;
	let version = currentVersion;

	for (const migration of migrations) {
		if (migration.version > version && migration.version <= targetVersion) {
			result = migration.migrate(result);
			version = migration.version;
		}
	}

	return IndexSchema.parse(result);
}
