import { Test, TestingModule } from '@nestjs/testing';
import { FixedAssetsCategoriesController } from './fixed-assets-categories.controller';
import { FixedAssetsCategoriesService } from './fixed-assets-categories.service';

describe('FixedAssetsCategoriesController', () => {
  let controller: FixedAssetsCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FixedAssetsCategoriesController],
      providers: [FixedAssetsCategoriesService],
    }).compile();

    controller = module.get<FixedAssetsCategoriesController>(FixedAssetsCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
