import { Permissions } from '@/common/decorators/permissions.decorator';
import { TenantContextService } from '@/common/services/tenant-context.service';
import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(
    private readonly statsService: StatsService,
    private readonly tenantContext: TenantContextService,
  ) { }

  @Get('dashboard')
  // @Permissions({
  //   resource: 'dashboard:stats',
  //   action: 'read',
  //   scope: 'tenant',
  // })
  async getDashboardStats(@Req() req: Request) {
    const { targetTenantId } = this.tenantContext.getTenantContext(req);
    return this.statsService.getDashboardStats(targetTenantId);
  }
}
