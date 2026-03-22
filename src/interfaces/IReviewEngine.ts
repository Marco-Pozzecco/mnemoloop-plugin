export interface IReviewEngine<Entity> {
  sort: (list: Entity[]) => Entity[];
  calculate: (item: Entity, score: number) => Entity
}
