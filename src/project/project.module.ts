import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { Projects } from './entities/Projects';
import { Users } from '../user/entities/Users';
import { ProjectUser } from './entities/ProjectUser';
import { Cities } from '../location/entities/Cities';
import { Neighborhoods } from '../unitwork/entities/Neighborhoods';
import { Provinces } from '../location/entities/Provinces';
import { UserModule } from '../user/user.module';
import { TreeModule } from '../tree/tree.module';
import { UnitWorkModule } from '../unitwork/unitwork.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Projects, Users, ProjectUser, Cities, Neighborhoods, Provinces]),
    UserModule,
    forwardRef(() => TreeModule),
    UnitWorkModule,
  ],
  providers: [ProjectService],
  controllers: [ProjectController],
  exports: [ProjectService],
})
export class ProjectModule {}
