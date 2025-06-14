import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitWorkService } from './unitwork.service';
import { UnitWorkController } from './unitwork.controller';
import { UnitWork } from './entities/UnitWork';
import { Projects } from '../project/entities/Projects';
import { Neighborhoods } from './entities/Neighborhoods';
import { Coordinates } from '../shared/entities/Coordinates';
import { Trees } from '../tree/entities/Trees';

@Module({
  imports: [TypeOrmModule.forFeature([UnitWork, Projects, Neighborhoods, Trees, Coordinates])],
  providers: [UnitWorkService],
  controllers: [UnitWorkController],
})
export class UnitWorkModule {}
