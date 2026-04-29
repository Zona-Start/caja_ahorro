import { SecurityModule } from '@/features/core/security/security.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '../drizzle.module';
import { AccountPlanSeederService } from './seed-tenants-default.service';
import { SeedService } from './seed.service';

@Module({
  imports: [ConfigModule, SecurityModule, DrizzleModule],
  providers: [SeedService, AccountPlanSeederService],
  exports: [SeedService, AccountPlanSeederService],
})
export class SeedModule {}
