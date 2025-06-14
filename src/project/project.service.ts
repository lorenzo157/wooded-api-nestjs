import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Projects } from './entities/Projects';
import { ReadProjectDto } from './dto/read-project.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectUser } from '../project/entities/ProjectUser';
import { Cities } from '../shared/entities/Cities';
import { ReadUserDto } from '../user/dto/read-user.dto';
import { UserService } from '../user/user.service';
import { Trees } from '../tree/entities/Trees';
import { UnitWork } from '../unitwork/entities/UnitWork';
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Projects) private readonly projectRepository: Repository<Projects>,
    @InjectRepository(ProjectUser) private readonly projectUserRepository: Repository<ProjectUser>,
    @InjectRepository(Cities) private readonly cityRepository: Repository<Cities>,
    @InjectRepository(Trees) private readonly treeRepository: Repository<Trees>,
    private readonly userService: UserService,
    @InjectRepository(UnitWork) private readonly unitWorkRepository: Repository<UnitWork>,
  ) {}

  async createProject(createProjectDto: CreateProjectDto) {
    const city = await this.cityRepository.findOne({ where: { idCity: createProjectDto.cityId } });

    if (!city) {
      return 'Invalid idCity';
    }

    const user = await this.userService.findUserEntityById(createProjectDto.userId);

    if (!user) {
      return 'Invalid idUser';
    }

    const project = new Projects();
    project.city = city;
    project.endDate = createProjectDto.endDate;
    project.projectName = createProjectDto.projectName;
    project.startDate = createProjectDto.startDate;
    project.projectDescription = createProjectDto.projectDescription;
    project.projectType = createProjectDto.projectType;
    project.user = user;

    const newProject = this.projectRepository.create(project);

    this.projectRepository.save(newProject);

    return {
      statusCode: HttpStatus.OK,
      message: 'Project created or updated successfully',
    };
  }

  async findAllAssignedProjectsToUser(idUser: number): Promise<ReadProjectDto[] | string> {
    const user = await this.userService.findUserEntityById(idUser);

    if (!user) {
      return 'Invalid idUser';
    }

    const projects = await this.projectUserRepository
      .createQueryBuilder('project_user')
      .innerJoinAndSelect('project_user.project', 'project')
      .innerJoinAndSelect('project.city', 'projectCity')
      .innerJoinAndSelect('projectCity.province', 'projectProvince')
      .where('project_user.userId = :idUser', { idUser })
      .select([
        'project.idProject AS "idProject"',
        'project.projectName AS "projectName"',
        'project.projectDescription AS "projectDescription"',
        'project.startDate  AS "startDate"',
        'project.endDate AS "endDate"',
        'project.projectType AS "projectType"',
        'projectCity.cityName AS "cityName"',
        'projectProvince.provinceName AS "provinceName"',
      ])
      .getRawMany();

    return projects.map((project) => ({
      idProject: project.idProject,
      projectName: project.projectName,
      projectDescription: project.projectDescription,
      startDate: project.startDate,
      endDate: project.endDate,
      projectType: project.projectType,
      cityName: project.cityName,
      provinceName: project.provinceName,
    }));
  }

  async findAllCreatedProjectsByUser(idUser: number): Promise<ReadProjectDto[] | string> {
    const user = await this.userService.findUserById(idUser);

    if (!user) {
      return 'Invalid idUser';
    }

    const projects = await this.projectRepository
      .createQueryBuilder('project')
      .innerJoinAndSelect('project.user', 'user')
      .innerJoinAndSelect('project.city', 'projectCity')
      .innerJoinAndSelect('projectCity.province', 'projectProvince')
      .where('user.idUser = :idUser', { idUser })
      .select([
        'project.idProject AS "idProject"',
        'project.projectName AS "projectName"',
        'project.projectDescription AS "projectDescription"',
        'project.startDate  AS "startDate"',
        'project.endDate AS "endDate"',
        'project.projectType AS "projectType"',
        'projectCity.cityName AS "cityName"',
        'projectProvince.provinceName AS "provinceName"',
      ])
      .orderBy('project.idProject', 'ASC')
      .getRawMany();

    return projects.map((project) => ({
      idProject: project.idProject,
      projectName: project.projectName,
      projectDescription: project.projectDescription,
      startDate: project.startDate,
      endDate: project.endDate,
      projectType: project.projectType,
      cityName: project.cityName,
      provinceName: project.provinceName,
    }));
  }

  async findAllAssignedUsersWithProject(idProject: number): Promise<ReadUserDto[]> {
    const users = await this.projectUserRepository
      .createQueryBuilder('project_user')
      .innerJoinAndSelect('project_user.user', 'user')
      .innerJoinAndSelect('user.city', 'city')
      .innerJoinAndSelect('user.role', 'role')
      .innerJoinAndSelect('city.province', 'province')
      .where('project_user.projectId = :idProject', { idProject })
      .select([
        'user.idUser AS "idUser"',
        'user.first AS "firstName"',
        'user.lastName AS "lastName"',
        'user.email AS "email"',
        'user.password AS "password"',
        'user.phoneNumber AS "phoneNumber"',
        'user.address AS "address"',
        'user.city AS "city"',
        'city.cityName AS "cityName"',
        'role.roleName AS "roleName"',
        'province.provinceName AS "provinceName"',
      ])
      .getRawMany();

    return users.map((user) => ({
      idUser: user.idUser,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      phoneNumber: user.phoneNumber,
      address: user.address,
      cityName: user.cityName,
      roleName: user.roleName,
      provinceName: user.provinceName,
    }));
  }

  async assignUserToProject(idProject: number, idUser: number) {
    // Objects for Project and User with given ids
    const project = await this.projectRepository.findOne({ where: { idProject: idProject } });
    const user = await this.userService.findUserById(idUser);

    var inserted = await this.projectUserRepository.findOne({
      where: {
        userId: idUser,
        projectId: idProject,
      },
    });

    var ReturnString: string;

    // Valid Project and User?

    if (!project) {
      ReturnString = 'Invalid project';
    } else {
      if (!user) {
        ReturnString = 'Invalid user';
      } else {
        if (inserted) {
          ReturnString = 'Alredy inserted';
        } else {
          const ProjectUser = this.projectUserRepository.create({
            projectId: idProject,
            userId: idUser,
          });
          return await this.projectUserRepository.save(ProjectUser);
        }
      }
    }
    return ReturnString;
  }

  async removeUserFromProject(idProject: number, idUser: number) {
    const user = await this.userService.findUserById(idUser);
    const project = this.findProject(idProject);
    if (!user || !project) {
      return null;
    }
    return this.projectUserRepository.delete({ projectId: idProject, userId: idUser });
  }

  async updateProjectById(idProject: number, updateProjectDto: UpdateProjectDto) {
    const project = await this.findProject(idProject);

    const { projectName, projectDescription, startDate, endDate, projectType } = updateProjectDto;

    const idCity = updateProjectDto.idCity;
    const city = await this.cityRepository.findOne({ where: { idCity } });

    if (!project || !city) {
      return null;
    }

    const partialUpdate = {
      ...(projectName && { projectName }),
      ...(projectDescription && { projectDescription }),
      ...(city && { city }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(projectType !== undefined && { projectType }),
    };
    const result = await this.projectRepository.update(idProject, partialUpdate);

    if (result.affected === 0) {
      throw new NotFoundException('Invalid update');
    }

    return project;
  }

  async getIdUserByIdProject(idProject: number) {
    const user = this.projectRepository
      .createQueryBuilder('project')
      .innerJoinAndSelect('project.user', 'user')
      .where('project.idProject = :idProject', { idProject })
      .select(['user.idUser AS "idUser"'])
      .getRawOne();
    return user;
  }

  async findTresByIdProject(idProject: number) {
    const trees = this.treeRepository
      .createQueryBuilder('tree')
      .innerJoinAndSelect('tree.project', 'project')
      .where('project.idProject = :idProject', { idProject })
      .select([
        'tree.idTree AS "idTree"',
        'tree.address AS "address"',
        'tree.datetime AS "datetime"',
        'tree.treeValue AS "treeValue"',
        'tree.risk AS "risk"',
      ])
      .getRawMany();
    return trees;
  }

  async removeProjectById(idProject: number) {
    const project = await this.findProject(idProject);
    if (!project) {
      return 'Invalid idProject';
    }
    const projectUser = await this.projectUserRepository.findOne({ where: { projectId: idProject } });
    if (projectUser) {
      // Delete association project-user
      this.projectUserRepository.delete({ project: { idProject } });
    }
    const idsFromTrees = await this.getIdsFromTreesByProjectId(idProject);
    if (idsFromTrees) {
      // Delete trees associated with project
      idsFromTrees.forEach(async (id) => {
        await this.treeRepository.delete(id);
      });
    }

    const unitwork = await this.unitWorkRepository.findOne({ where: { projectId: idProject } });

    if (unitwork) {
      // Delete unit work associated with project
      this.unitWorkRepository.delete({ project: { idProject } });
    }

    return await this.projectRepository.delete(idProject);
  }

  async getIdsFromTreesByProjectId(idProject: number) {
    const trees = this.treeRepository
      .createQueryBuilder('trees')
      .innerJoinAndSelect('trees.project', 'project')
      .where('project.idProject = :idProject', { idProject })
      .select([
        'tree.idTree AS "idTree"',
        'tree.address AS "address"',
        'tree.datetime AS "datetime"',
        'tree.treeValue AS "treeValue"',
        'tree.treeName AS "treeName"',
        'tree.risk AS "risk"',
      ])
      .getRawMany();
    return trees;
  }

  async findProject(idProject: number): Promise<ReadProjectDto | null> {
    const project = await this.projectRepository
      .createQueryBuilder('project')
      .innerJoinAndSelect('project.city', 'city')
      .innerJoinAndSelect('city.province', 'province')
      .where('project.idProject = :idProject', { idProject })
      .select([
        'project.idProject AS "idProject"',
        'project.projectName AS "projectName"',
        'project.projectDescription AS "projectDescription"',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.projectType AS "projectType"',
        'city.cityName AS "cityName"',
        'province.provinceName AS "provinceName"',
      ])
      .getRawOne();

    if (!project) {
      return null;
    }
    return Object.assign(new ReadProjectDto(), {
      idProject: project.idProject,
      projectName: project.projectName,
      projectDescription: project.projectDescription,
      startDate: project.startDate,
      endDate: project.endDate,
      projectType: project.projectType,
      cityName: project.cityName,
      provinceName: project.provinceName,
    });
  }
}
