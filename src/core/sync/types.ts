import { CardStatus } from '../parser/types';

export { CardStatus };

export enum SyncSource {
  JSON = 'json',
  YAML = 'yaml',
}

export interface SyncState {
  uuid: string;
  source: SyncSource;
  timestamp: string;
  changes: Record<string, any>;
  conflict: boolean;
}

export interface SyncResult {
  success: boolean;
  conflicts_resolved: number;
  errors: string[];
}

export interface SyncConflict {
  field: string;
  json_value: any;
  yaml_value: any;
  last_write: 'json' | 'yaml';
  resolved_value: any;
}

export interface IndexRecoveryResult {
  success: boolean;
  cards_recovered: number;
  cards_failed: number;
  errors: Array<{
    file: string;
    error: string;
  }>;
  duration_ms: number;
}

export interface Index {
  version: string;
  last_updated: string;
  cards: Record<string, any>;
}

export const DEFAULT_INDEX: Index = {
  version: '1.0.0',
  last_updated: new Date().toISOString(),
  cards: {},
};
