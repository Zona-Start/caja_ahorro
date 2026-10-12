import { Public } from '@/common/decorators/public.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TenantResolveService } from './tenant-resolve.service';

@ApiTags('tenant')
@Controller('tenant')
export class TenantPublicController {
  constructor(private readonly tenantResolve: TenantResolveService) {}

  @Public()
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  @Get('resolve')
  @ApiOperation({ summary: 'Resolver la marca del tenant por host' })
  async resolve(@Query('host') host?: string) {
    if (!host) return null;
    return this.tenantResolve.resolve(host);
  }
}
