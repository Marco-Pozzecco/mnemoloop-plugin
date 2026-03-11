export interface IEngine<Entity> {
  sort: (list: Entity[]) => Entity[];
  calculate: (item: Entity, score: number) => Entity
}
