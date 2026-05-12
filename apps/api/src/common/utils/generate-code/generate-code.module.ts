import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { GenerateCodeService } from './generate-code.service';

@Module({
  imports: [DrizzleModule],
  providers: [GenerateCodeService],
  exports: [GenerateCodeService],
})
export class GenerateCodeModule {}
