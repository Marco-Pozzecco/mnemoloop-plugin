import { IEngine } from '@/interfaces/IEngine';

export abstract class BaseEngine<Entity> implements IEngine<Entity> {
  abstract sort(list: Entity[]): Entity[];
  abstract calculate: (item: Entity, score: number) => Entity;
}
