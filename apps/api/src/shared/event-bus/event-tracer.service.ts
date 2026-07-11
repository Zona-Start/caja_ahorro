import { Injectable, Logger } from '@nestjs/common';
import { type EventEnvelope } from './event-envelope';

export interface TraceEntry {
  eventId: string;
  eventType: string;
  aggregateId: string;
  tenantId: string;
  handlerName?: string;
  phase:
    | 'PUBLISHED'
    | 'RECEIVED'
    | 'PROCESSED'
    | 'FAILED'
    | 'RETRIED'
    | 'DLQ'
    | 'SKIPPED';
  attempt?: number;
  error?: string;
  timestamp: string;
}

@Injectable()
export class EventTracerService {
  private readonly logger = new Logger('EventTracer');

  private log(entry: TraceEntry): void {
    const message = JSON.stringify(entry);
    switch (entry.phase) {
      case 'FAILED':
      case 'DLQ':
        this.logger.error(message);
        break;
      case 'RETRIED':
        this.logger.warn(message);
        break;
      default:
        this.logger.log(message);
    }
  }

  published(envelope: EventEnvelope): void {
    this.log({
      eventId: envelope.eventId,
      eventType: envelope.type,
      aggregateId: envelope.aggregateId,
      tenantId: envelope.tenantId,
      phase: 'PUBLISHED',
      timestamp: new Date().toISOString(),
    });
  }

  received(handlerName: string, envelope: EventEnvelope): void {
    this.log({
      eventId: envelope.eventId,
      eventType: envelope.type,
      aggregateId: envelope.aggregateId,
      tenantId: envelope.tenantId,
      handlerName,
      phase: 'RECEIVED',
      timestamp: new Date().toISOString(),
    });
  }

  processed(handlerName: string, envelope: EventEnvelope): void {
    this.log({
      eventId: envelope.eventId,
      eventType: envelope.type,
      aggregateId: envelope.aggregateId,
      tenantId: envelope.tenantId,
      handlerName,
      phase: 'PROCESSED',
      timestamp: new Date().toISOString(),
    });
  }

  failed(handlerName: string, envelope: EventEnvelope, error: Error): void {
    this.log({
      eventId: envelope.eventId,
      eventType: envelope.type,
      aggregateId: envelope.aggregateId,
      tenantId: envelope.tenantId,
      handlerName,
      phase: 'FAILED',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  retried(handlerName: string, envelope: EventEnvelope, attempt: number): void {
    this.log({
      eventId: envelope.eventId,
      eventType: envelope.type,
      aggregateId: envelope.aggregateId,
      tenantId: envelope.tenantId,
      handlerName,
      phase: 'RETRIED',
      attempt,
      timestamp: new Date().toISOString(),
    });
  }

  dlq(handlerName: string, envelope: EventEnvelope, error: Error): void {
    this.log({
      eventId: envelope.eventId,
      eventType: envelope.type,
      aggregateId: envelope.aggregateId,
      tenantId: envelope.tenantId,
      handlerName,
      phase: 'DLQ',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  skipped(handlerName: string, envelope: EventEnvelope): void {
    this.log({
      eventId: envelope.eventId,
      eventType: envelope.type,
      aggregateId: envelope.aggregateId,
      tenantId: envelope.tenantId,
      handlerName,
      phase: 'SKIPPED',
      timestamp: new Date().toISOString(),
    });
  }
}
