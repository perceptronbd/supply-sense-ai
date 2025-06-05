import { Test, TestingModule } from '@nestjs/testing';
import { RequestFormController } from './request-form.controller';
import { RequestFormService } from './request-form.service';

describe('RequestFormController', () => {
  let controller: RequestFormController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestFormController],
      providers: [RequestFormService],
    }).compile();

    controller = module.get<RequestFormController>(RequestFormController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
