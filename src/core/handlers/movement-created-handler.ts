import { ServerError, throwServerError } from '@/domain/errors/server.error';
import { IEventHandler } from '@/infra/events/types';
import z from 'zod';
import { MovementEvent } from '../events/movement-event';
import { ICompleteMovementUseCase } from '../usecases/movements/complete-movement-usecase';

const movementCreatedSchema = z.object({
  id: z.uuid({ message: 'ID deve ser um UUID válido' }),
});

export class MovementCreatedHandler implements IEventHandler<MovementEvent> {
  constructor(
    private readonly completeMovementUseCase: ICompleteMovementUseCase,
  ) {}

  async handle(event: MovementEvent): Promise<void> {
    const result = movementCreatedSchema.safeParse(event.data);

    if (!result.success) {
      throw new ServerError(
        `Failed to validate movement: ${result.error.message}`,
        result.error,
      );
    }

    const { id: movementId } = result.data;

    await this.completeMovementUseCase
      .execute({ movementId })
      .catch(throwServerError(`Failed to complete movement ${event.data.id}`));
  }
}
