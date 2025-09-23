import { BaseEvent } from '@/infrastructure/events/types';
import { Movement } from '@prisma/client';

export enum MovementEventType {
  ALL = 'movement.*',
  CREATED = 'movement.created',
  UPDATED = 'movement.updated',
  DELETED = 'movement.deleted',
}

export type MovementEvent = BaseEvent<MovementEventType> & {
  data: Movement;
};

export function createMovementEvent(
  type: MovementEventType,
  data: Movement,
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
