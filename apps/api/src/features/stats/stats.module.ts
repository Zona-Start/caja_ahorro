import { TenantContextModule } from '@/common/services/tenant-context.module';
import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [DrizzleModule, TenantContextModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
