import { EventFactory } from '@/core/events';
import { MovementEventType } from '@/core/events/movement-event';
import { IMovementRepository } from '@/domain/contracts/repositories/movement-repository';
import { IUseCase } from '@/domain/contracts/usecases/interfaces';
import { MovementStatus } from '@/domain/entities/movement.entity';
import { MovementNotFoundError } from '@/domain/errors/movement.errors';
import { IEventManager } from '@/infra/events/types';

type Input = {
  movementId: string;
};
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
    const { movementId } = input;

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

    this.eventManager.publish(movementEvent);

    return {
      movementId: movement.id,
    };
  }
}
