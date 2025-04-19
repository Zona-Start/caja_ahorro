import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { SettingsSystemController } from './settings-system.controller';
import { SettingsSystemService } from './settings-system.service';

@Module({
  imports: [DrizzleModule],
  controllers: [SettingsSystemController],
  providers: [SettingsSystemService],
  exports: [SettingsSystemService],
})
export class SettingsSystemModule {}
