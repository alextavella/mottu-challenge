export interface Account {
  readonly id: string;
  readonly balance: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateAccountData {
  readonly id: string;
  readonly initialBalance?: number;
}
