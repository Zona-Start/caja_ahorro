import { Public } from '@/common/decorators/public.decorator';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { TenantResolutionService } from './services/tenant-resolution.service';

const ResolveQuerySchema = z.object({
  host: z.string().min(1),
});

const WorkspaceLookupSchema = z.object({
  email: z.string().email(),
});

@Controller('public')
export class TenantPublicController {
  constructor(private readonly resolutionService: TenantResolutionService) {}

  @Public()
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  @Get('tenants/resolve')
  async resolve(@Query() query: { host?: string }) {
    const { host } = ResolveQuerySchema.parse({ host: query.host });
    return this.resolutionService.resolveHost(host);
  }

  @Public()
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @Post('auth/workspace-lookup')
  async workspaceLookup(@Body() body: { email?: string }) {
    const { email } = WorkspaceLookupSchema.parse({ email: body.email });
    const tenants = await this.resolutionService.lookupByEmail(email);
    return { tenants };
  }
}
