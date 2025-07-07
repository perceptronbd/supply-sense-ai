import { Test, type TestingModule } from '@nestjs/testing';
import { ManufacturingListController } from './manufacturing-list.controller';
import { ManufacturingListService } from './manufacturing-list.service';

describe('ManufacturingListController', () => {
  let controller: ManufacturingListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManufacturingListController],
      providers: [ManufacturingListService],
    }).compile();

    controller = module.get<ManufacturingListController>(ManufacturingListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
