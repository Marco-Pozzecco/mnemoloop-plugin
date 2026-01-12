import { CardMetadata } from '../schema/indexSchema';

export interface IIndexManager {
  load(): Promise<void>;
  save(): Promise<void>;
  getCard(id: string): CardMetadata | undefined;
  upsertCard(id: string, data: Partial<CardMetadata>): void;
  deleteCard(id: string): void;
  rebuildFromVault(): Promise<void>;
}