import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { AssociatesController } from './associates.controller';
import { AssociatesService } from './associates.service';

@Module({
  imports: [DrizzleModule],
  controllers: [AssociatesController],
  providers: [AssociatesService],
  exports: [AssociatesService],
})
export class AssociatesModule {}
