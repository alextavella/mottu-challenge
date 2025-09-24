export interface IEntity<Output> {
  perform(): Promise<Output>;
}

export interface IValidatableEntity {
  validate(): void;
}
