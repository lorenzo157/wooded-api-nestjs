import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Users } from './entities/Users';
import { ProjectUser } from '../project/entities/ProjectUser';
import { Projects } from '../project/entities/Projects';
import { Cities } from '../location/entities/Cities';
import { Roles } from './entities/Roles';
import { RolePermission } from './entities/RolePermission';
import { Permissions } from './entities/Permissions';

@Module({
  imports: [TypeOrmModule.forFeature([Users, ProjectUser, Projects, Cities, Roles, RolePermission, Permissions])],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
