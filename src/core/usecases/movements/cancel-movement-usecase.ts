import { EventFactory } from '@/core/events';
import { MovementEventType } from '@/core/events/movement-event';
import { IMovementRepository } from '@/domain/contracts/repositories/movement-repository';
import { IUseCase } from '@/domain/contracts/usecases/interfaces';
import {
  MovementData,
  MovementStatus,
} from '@/domain/entities/movement.entity';
import { MovementNotFoundError } from '@/domain/errors/movement.errors';
import { throwServerError } from '@/domain/errors/server.error';
import { IEventManager } from '@/infra/events/types';

type Input = MovementData;
type Output = {
  movementId: string;
};

export type ICancelMovementUseCase = IUseCase<Input, Output>;

export class CancelMovementUseCase implements ICancelMovementUseCase {
  constructor(
    private readonly movementRepository: IMovementRepository,
    private readonly eventManager: IEventManager,
  ) {}

  async execute(input: Input): Promise<Output> {
    const { id: movementId } = input;

    // Find the movement
    const movement = await this.movementRepository
      .findById(movementId)
      .catch(() => null);

    if (!movement) {
      throw new MovementNotFoundError(movementId);
    }

    // Update the movement status
    const updatedMovement = await this.movementRepository.updateStatus(
      movementId,
      MovementStatus.CANCELLED,
    );

    const movementEvent = EventFactory.createMovementEvent(
      MovementEventType.UPDATED,
      updatedMovement,
    );

    this.eventManager
      .publish(movementEvent)
      .catch(throwServerError('Failed to publish movement event:'));

    return {
      movementId: movement.id,
    };
  }
}
