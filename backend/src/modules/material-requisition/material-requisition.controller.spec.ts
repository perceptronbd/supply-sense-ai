import { Test, type TestingModule } from '@nestjs/testing';
import { MaterialRequisitionController } from './material-requisition.controller';
import { MaterialRequisitionService } from './material-requisition.service';

describe('MaterialRequisitionController', () => {
  let controller: MaterialRequisitionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialRequisitionController],
      providers: [MaterialRequisitionService],
    }).compile();

    controller = module.get<MaterialRequisitionController>(MaterialRequisitionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
