import { Public } from '@/common/decorators/public.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Estado del servicio' })
  check() {
    return {
      status: 'ok',
      service: 'portal-api',
      timestamp: new Date().toISOString(),
    };
  }
}
