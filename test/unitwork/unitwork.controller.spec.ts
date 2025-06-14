import { Test, TestingModule } from '@nestjs/testing';
import { UnitWorkController } from '../../src/unitwork/unitwork.controller';
import { UnitWorkService } from '../../src/unitwork/unitwork.service';

describe('UnitWorkController', () => {
  let controller: UnitWorkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnitWorkController],
      providers: [UnitWorkService],
    }).compile();

    controller = module.get<UnitWorkController>(UnitWorkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
