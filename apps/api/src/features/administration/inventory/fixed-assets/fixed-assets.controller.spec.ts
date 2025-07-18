import { Test, TestingModule } from '@nestjs/testing';
import { FixedAssetsController } from './fixed-assets.controller';
import { FixedAssetsService } from './fixed-assets.service';

describe('FixedAssetsController', () => {
  let controller: FixedAssetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FixedAssetsController],
      providers: [FixedAssetsService],
    }).compile();

    controller = module.get<FixedAssetsController>(FixedAssetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
