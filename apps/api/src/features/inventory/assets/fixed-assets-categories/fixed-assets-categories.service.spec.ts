import { Test, TestingModule } from '@nestjs/testing';
import { FixedAssetsCategoriesService } from './fixed-assets-categories.service';

describe('FixedAssetsCategoriesService', () => {
  let service: FixedAssetsCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FixedAssetsCategoriesService],
    }).compile();

    service = module.get<FixedAssetsCategoriesService>(FixedAssetsCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
