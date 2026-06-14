import type { EventEnvelope, EventSource } from './event-envelope';

export interface IEventBus {
  publish<T>(event: string, payload: T, source?: EventSource): void;
  subscribe<T>(event: string, handler: EventHandler<EventEnvelope<T>>): void;
  unsubscribe(event: string, handler: EventHandler): void;
}

export type EventHandler<T = any> = (payload: T) => void | Promise<void>;

export const EVENT_BUS_TOKEN = 'IEventBus';
