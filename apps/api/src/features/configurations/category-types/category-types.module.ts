import { DrizzleModule } from '@/database/drizzle.module';
import { Module } from '@nestjs/common';
import { CategoryTypesController } from './category-types.controller';
import { CategoryTypesService } from './category-types.service';

@Module({
  imports: [DrizzleModule],
  controllers: [CategoryTypesController],
  providers: [CategoryTypesService],
  exports: [CategoryTypesService],
})
export class CategoryTypesModule {}
