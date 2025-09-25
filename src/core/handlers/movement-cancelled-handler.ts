import { ServerError, throwServerError } from '@/domain/errors/server.error';
import { IEventHandler } from '@/infra/events/types';
import z from 'zod';
import { MovementEvent } from '../events/movement-event';
import { ICancelMovementUseCase } from '../usecases/movements/cancel-movement-usecase';

const movementCancelledSchema = z.object({
  id: z.uuid({ message: 'ID deve ser um UUID válido' }),
});

export class MovementCancelledHandler implements IEventHandler<MovementEvent> {
  constructor(private readonly cancelMovementUseCase: ICancelMovementUseCase) {}

  async handle(event: MovementEvent): Promise<void> {
    const result = movementCancelledSchema.safeParse(event.data);

    if (!result.success) {
      throw new ServerError(
        `Failed to validate movement: ${result.error.message}`,
        result.error,
      );
    }

    const { id: movementId } = result.data;

    await this.cancelMovementUseCase
      .execute({ movementId })
      .catch(throwServerError(`Failed to cancel movement ${event.data.id}`));
  }
}
