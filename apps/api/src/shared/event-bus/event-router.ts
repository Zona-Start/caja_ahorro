import { Injectable, Logger } from '@nestjs/common';

export interface RouteEntry {
  event: string;
  domain: string;
  description: string;
  sourceModule: string;
  targetModules: string[];
}

@Injectable()
export class EventRouter {
  private readonly logger = new Logger(EventRouter.name);
  private routes = new Map<string, RouteEntry>();

  register(entry: RouteEntry): void {
    this.routes.set(entry.event, entry);
    this.logger.debug(
      `Route registered: ${entry.event} (${entry.domain}) — ${entry.sourceModule} → ${entry.targetModules.join(', ')}`,
    );
  }

  getRoute(event: string): RouteEntry | undefined {
    return this.routes.get(event);
  }

  getRoutesByDomain(domain: string): RouteEntry[] {
    return Array.from(this.routes.values()).filter((r) => r.domain === domain);
  }

  getRoutesBySource(sourceModule: string): RouteEntry[] {
    return Array.from(this.routes.values()).filter((r) => r.sourceModule === sourceModule);
  }

  getRoutesByTarget(targetModule: string): RouteEntry[] {
    return Array.from(this.routes.values()).filter((r) =>
      r.targetModules.includes(targetModule),
    );
  }

  getAllRoutes(): RouteEntry[] {
    return Array.from(this.routes.values());
  }
}
