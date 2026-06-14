import { Injectable } from '@nestjs/common';

export interface EventMetricsSnapshot {
  processed: Record<string, number>;
  failed: Record<string, number>;
  retried: Record<string, number>;
  dlq: Record<string, number>;
}

@Injectable()
export class EventMetricsService {
  private processed = new Map<string, number>();
  private failed = new Map<string, number>();
  private retried = new Map<string, number>();
  private dlq = new Map<string, number>();

  private inc(map: Map<string, number>, key: string): void {
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  incrementProcessed(eventType: string): void {
    this.inc(this.processed, eventType);
  }

  incrementFailed(eventType: string): void {
    this.inc(this.failed, eventType);
  }

  incrementRetried(eventType: string): void {
    this.inc(this.retried, eventType);
  }

  incrementDlq(eventType: string): void {
    this.inc(this.dlq, eventType);
  }

  getMetrics(): EventMetricsSnapshot {
    return {
      processed: Object.fromEntries(this.processed),
      failed: Object.fromEntries(this.failed),
      retried: Object.fromEntries(this.retried),
      dlq: Object.fromEntries(this.dlq),
    };
  }

  reset(): void {
    this.processed.clear();
    this.failed.clear();
    this.retried.clear();
    this.dlq.clear();
  }
}
