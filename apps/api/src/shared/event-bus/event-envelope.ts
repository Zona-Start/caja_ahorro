import { v4 as uuidv4 } from 'uuid';

export type EventSource = 'outbox' | 'direct';

export interface EventEnvelope<T = any> {
  eventId: string;
  type: string;
  aggregateId: string;
  tenantId: string;
  timestamp: number;
  source: EventSource;
  payload: T;
}

export function createEnvelope<T>(
  type: string,
  payload: T,
  aggregateId?: string,
  source: EventSource = 'direct',
): EventEnvelope<T> {
  const tenantId = (payload as any)?.tenantId ?? '';
  const derivedAggregateId =
    aggregateId ??
    (payload as any)?.loanId ??
    (payload as any)?.paymentId ??
    (payload as any)?.id ??
    '';

  return {
    eventId: uuidv4(),
    type,
    aggregateId: derivedAggregateId,
    tenantId,
    timestamp: Date.now(),
    source,
    payload,
  };
}

export function envelopeFromOutbox<T>(
  eventType: string,
  eventId: string,
  aggregateId: string,
  tenantId: string,
  payload: T,
): EventEnvelope<T> {
  return {
    eventId,
    type: eventType,
    aggregateId,
    tenantId,
    timestamp: Date.now(),
    source: 'outbox',
    payload,
  };
}
