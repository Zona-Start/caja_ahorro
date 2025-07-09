import { Test, TestingModule } from '@nestjs/testing';
import { SalesProductsController } from './sales-products.controller';
import { SalesProductsService } from './sales-products.service';

describe('SalesProductsController', () => {
  let controller: SalesProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesProductsController],
      providers: [SalesProductsService],
    }).compile();

    controller = module.get<SalesProductsController>(SalesProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
