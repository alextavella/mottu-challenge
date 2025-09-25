import { ILedgerLogRepository } from '@/domain/contracts/repositories/ledger-log-repository';
import { IUseCase } from '@/domain/contracts/usecases/interfaces';
import { CreateLedgerLogData } from '@/domain/entities/ledger-log.entity';
import { ServerError } from '@/domain/errors/server.error';

type Input = CreateLedgerLogData;
type Output = void;

export type ICreateLedgerLogUseCase = IUseCase<Input, Output>;

export class CreateLedgerLogUseCase implements ICreateLedgerLogUseCase {
  constructor(private readonly ledgerLogRepository: ILedgerLogRepository) {}

  async execute(input: Input): Promise<Output> {
    const { accountId, movementId, type, amount, data } = input;

    try {
      await this.ledgerLogRepository.create({
        accountId,
        movementId,
        type,
        amount,
        data,
      });
    } catch (error) {
      throw new ServerError(
        `Failed to create ledger log for movement ${movementId}`,
        error as Error,
      );
    }
  }
}
