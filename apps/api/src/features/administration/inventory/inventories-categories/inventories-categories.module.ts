import { Module } from '@nestjs/common';
import { InventoriesCategoriesController } from './inventories-categories.controller';
import { InventoriesCategoriesService } from './inventories-categories.service';

@Module({
  controllers: [InventoriesCategoriesController],
  providers: [InventoriesCategoriesService],
})
export class InventoriesCategoriessModule {}
