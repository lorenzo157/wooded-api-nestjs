import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { Projects } from './entities/Projects';
import { Trees } from '../tree/entities/Trees';
import { Users } from '../user/entities/Users';
import { ProjectUser } from './entities/ProjectUser';
import { Cities } from '../shared/entities/Cities';
import { UnitWork } from '../unitwork/entities/UnitWork';
import { Neighborhoods } from '../unitwork/entities/Neighborhoods';
import { Provinces } from '../shared/entities/Provinces';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Projects, Trees, Users, ProjectUser, Cities, UnitWork, Neighborhoods, Provinces]), UserModule],
  providers: [ProjectService],
  controllers: [ProjectController],
  exports: [ProjectService],
})
export class ProjectModule {}
