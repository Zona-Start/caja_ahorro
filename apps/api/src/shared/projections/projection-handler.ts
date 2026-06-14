import { type EventEnvelope } from '@/shared/event-bus';

export interface ProjectionHandler {
  readonly name: string;

  handle<T>(event: string, envelope: EventEnvelope<T>): Promise<void>;

  rebuild(): Promise<void>;
}
