import { HttpStatus, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Projects } from './entities/Projects';
import { ReadProjectDto } from './dto/read-project.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectUser } from '../project/entities/ProjectUser';
import { Cities } from '../location/entities/Cities';
import { ReadUserDto } from '../user/dto/read-user.dto';
import { UserService } from '../user/user.service';
import { TreeService } from '../tree/tree.service';
import { UnitWorkService } from '../unitwork/unitwork.service';
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Projects) private readonly projectRepository: Repository<Projects>,
    @InjectRepository(ProjectUser) private readonly projectUserRepository: Repository<ProjectUser>,
    @InjectRepository(Cities) private readonly cityRepository: Repository<Cities>,
    private readonly userService: UserService,
    @Inject(forwardRef(() => TreeService)) private readonly treeService: TreeService,
    private readonly unitWorkService: UnitWorkService,
  ) {}

  async createProject(createProjectDto: CreateProjectDto) {
    const city = await this.cityRepository.findOne({
      where: { cityName: createProjectDto.cityName, province: { provinceName: createProjectDto.provinceName } },
      relations: ['province'],
    });

    if (!city) {
      return 'Invalid city or province';
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
        'user.firstName AS "firstName"',
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

    const inserted = await this.projectUserRepository.findOne({
      where: {
        userId: idUser,
        projectId: idProject,
      },
    });

    let returnString: string;

    // Valid Project and User?

    if (!project) {
      returnString = 'Invalid project';
    } else {
      if (!user) {
        returnString = 'Invalid user';
      } else {
        if (inserted) {
          returnString = 'Alredy inserted';
        } else {
          const ProjectUser = this.projectUserRepository.create({
            projectId: idProject,
            userId: idUser,
          });
          return await this.projectUserRepository.save(ProjectUser);
        }
      }
    }
    return returnString;
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

    const { projectName, projectDescription, startDate, endDate } = updateProjectDto;

    if (!project) {
      return null;
    }

    const partialUpdate = {
      ...(projectName && { projectName }),
      ...(projectDescription && { projectDescription }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    };
    const result = await this.projectRepository.update(idProject, partialUpdate);

    if (result.affected === 0) {
      throw new NotFoundException('Invalid update');
    }

    return project;
  }

  async getNeighborhoodDataByProject(idProject: number) {
    return this.unitWorkService.getNeighborhoodDataByProject(idProject);
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
    const project = await this.projectRepository.findOne({
      where: { idProject },
      relations: ['trees'],
      select: {
        idProject: true,
        trees: { idTree: true, address: true, datetime: true, treeValue: true, risk: true },
      },
    });
    return project?.trees ?? [];
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
    await this.treeService.removeTreesByProjectId(idProject);

    await this.unitWorkService.removeUnitWorksByProjectId(idProject);

    return await this.projectRepository.delete(idProject);
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
