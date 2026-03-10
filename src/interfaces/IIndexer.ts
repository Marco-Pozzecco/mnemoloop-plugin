export interface IIndexer<Entity> {
  readonly index: Record<string, Entity>;

  initialize: () => Promise<void>;
  save: () => Promise<void>;

  get: (id: string) => Entity | undefined;
  getAll: () => Entity[];
  query: (predicate: (entity: Entity) => boolean) => Entity[];
  create: (id: string, data: Entity) => Entity;
  update: (id: string, data: Partial<Entity>) => Entity;
  delete: (id: string) => void;
}
