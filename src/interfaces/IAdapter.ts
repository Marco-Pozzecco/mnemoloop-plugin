export interface IAdapter<T> {
  readonly data: T;
  set: (data: T) => void;
  setField: (field: keyof T, value: unknown) => void;
  update: (data: Partial<T>) => void;
  save: () => Promise<void>;
  reset: () => Promise<void>;
  initialize: () => Promise<void>;
}
