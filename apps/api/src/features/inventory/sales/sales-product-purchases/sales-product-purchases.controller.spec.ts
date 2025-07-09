import { Test, TestingModule } from '@nestjs/testing';
import { SalesProductPurchasesController } from './sales-product-purchases.controller';
import { SalesProductPurchasesService } from './sales-product-purchases.service';

describe('SalesProductPurchasesController', () => {
  let controller: SalesProductPurchasesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesProductPurchasesController],
      providers: [SalesProductPurchasesService],
    }).compile();

    controller = module.get<SalesProductPurchasesController>(SalesProductPurchasesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
