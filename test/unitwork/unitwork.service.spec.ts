import { Test, TestingModule } from '@nestjs/testing';
import { UnitWorkService } from '../../src/unitwork/unitwork.service';

describe('UnitWorkService', () => {
  let service: UnitWorkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnitWorkService],
    }).compile();

    service = module.get<UnitWorkService>(UnitWorkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
