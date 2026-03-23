import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitWorkService } from './unitwork.service';
import { UnitWorkController } from './unitwork.controller';
import { UnitWork } from './entities/UnitWork';
import { Projects } from '../project/entities/Projects';
import { Neighborhoods } from './entities/Neighborhoods';
import { Coordinates } from '../location/entities/Coordinates';
import { TreeModule } from '../tree/tree.module';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UnitWork, Projects, Neighborhoods, Coordinates]),
    forwardRef(() => TreeModule),
    forwardRef(() => ProjectModule),
  ],
  providers: [UnitWorkService],
  controllers: [UnitWorkController],
  exports: [UnitWorkService],
})
export class UnitWorkModule {}
