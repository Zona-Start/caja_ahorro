import { Injectable, Logger } from '@nestjs/common';

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 200,
  maxDelayMs: 5000,
  backoffFactor: 2,
};

const HANDLER_CONFIGS = new Map<string, RetryConfig>();

export function configureRetry(
  handlerName: string,
  config: Partial<RetryConfig>,
): void {
  const existing = HANDLER_CONFIGS.get(handlerName) ?? DEFAULT_RETRY_CONFIG;
  HANDLER_CONFIGS.set(handlerName, { ...existing, ...config });
}

@Injectable()
export class RetryManager {
  private readonly logger = new Logger(RetryManager.name);

  getConfig(handlerName: string): RetryConfig {
    return HANDLER_CONFIGS.get(handlerName) ?? DEFAULT_RETRY_CONFIG;
  }

  shouldRetry(handlerName: string, attempt: number): boolean {
    const config = this.getConfig(handlerName);
    return attempt < config.maxRetries;
  }

  getDelay(handlerName: string, attempt: number): number {
    const config = this.getConfig(handlerName);
    const delay = config.baseDelayMs * Math.pow(config.backoffFactor, attempt);
    return Math.min(delay, config.maxDelayMs);
  }

  async sleep(handlerName: string, attempt: number): Promise<void> {
    const delay = this.getDelay(handlerName, attempt);
    this.logger.debug(`Retry sleep ${delay}ms (attempt ${attempt + 1})`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
