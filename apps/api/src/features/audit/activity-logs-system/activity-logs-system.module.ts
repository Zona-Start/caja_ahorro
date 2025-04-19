import { Module } from '@nestjs/common';
import { ActivityLogsSystemController } from './activity-logs-system.controller';
import { ActivityLogsSystemService } from './activity-logs-system.service';
import { DrizzleModule } from '@/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [ActivityLogsSystemController],
  providers: [ActivityLogsSystemService],
  exports: [ActivityLogsSystemService],
})
export class ActivityLogsSystemModule {}