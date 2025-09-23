import { Movement } from '@prisma/client';
import { BaseEvent } from '../../lib/events/types';

export enum MovementEventType {
  ALL = 'movement.*',
  CREATED = 'movement.created',
  UPDATED = 'movement.updated',
  DELETED = 'movement.deleted',
}

export interface MovementEvent extends BaseEvent {
  type: MovementEventType;
  data: Movement;
}

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
