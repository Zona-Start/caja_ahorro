import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { DrizzleModule } from '@/database/drizzle.module';
import { GenerateCodeModule } from '@/common/utils/generate-code/generate-code.module';

@Module({
  imports: [GenerateCodeModule, DrizzleModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
