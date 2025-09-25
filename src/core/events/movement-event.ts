import { BaseEvent } from '@/infra/events/types';
import { MovementData } from '../../domain/entities/movement.entity';

export enum MovementEventType {
  ALL = 'movement.*',
  CREATED = 'movement.created',
  UPDATED = 'movement.updated',
  CANCELLED = 'movement.cancelled',
}

export type MovementEvent = BaseEvent<MovementEventType> & {
  data: MovementData;
};

export function createMovementEvent(
  type: MovementEventType,
  data: MovementData,
  correlationId?: string,
): MovementEvent {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date(),
    version: '1.0',
    correlationId,
    data,
  };
}
