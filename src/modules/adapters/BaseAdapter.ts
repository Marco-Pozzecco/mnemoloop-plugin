import type { IAdapter } from '@/interfaces/IAdapter';

export abstract class BaseAdapter<T> implements IAdapter<T> {
  protected _data: T;

  constructor(protected defaultData: T) {
    this._data = defaultData;
  }

  get data(): T {
    return this._data;
  }

  set: (data: T) => void = (data) => {
    this._data = this.validate(data);
  };

  setField: (field: keyof T, value: unknown) => void = (field, value) => {
    this.update({ [field]: value } as Partial<T>);
  };

  update: (data: Partial<T>) => void = (data) => {
    this.set({ ...this._data, ...data } as T);
  };

  reset: () => Promise<void> = async () => {
    this.set(this.defaultData);
    await this.save();
  };

  abstract initialize: () => Promise<void>;
  abstract save: () => Promise<void>;

  protected validate(data: T): T {
    return data;
  }
}
