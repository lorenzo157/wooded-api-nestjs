import { ForbiddenException, HttpStatus, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
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

    const user = await this.userService.findUserById(createProjectDto.userId);

    if (!user) {
      return 'Invalid idUser';
    }

    const newProject = this.projectRepository.create({
      city,
      user: { idUser: user.idUser },
      endDate: createProjectDto.endDate,
      projectName: createProjectDto.projectName,
      startDate: createProjectDto.startDate,
      projectDescription: createProjectDto.projectDescription,
      projectType: createProjectDto.projectType,
    });

    this.projectRepository.save(newProject);

    return {
      statusCode: HttpStatus.OK,
      message: 'Project created or updated successfully',
    };
  }

  async findAllAssignedProjectsToUser(idUser: number): Promise<ReadProjectDto[] | string> {
    const user = await this.userService.findUserById(idUser);

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

  async findAllCreatedProjectsByUser(idUser: number, role: string): Promise<ReadProjectDto[]> {
    const isAdmin = role === 'administrador';

    const qb = this.projectRepository
      .createQueryBuilder('project')
      .innerJoinAndSelect('project.user', 'user')
      .innerJoinAndSelect('project.city', 'projectCity')
      .innerJoinAndSelect('projectCity.province', 'projectProvince')
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
      .orderBy('project.idProject', 'ASC');

    if (!isAdmin) {
      qb.where('user.idUser = :idUser', { idUser });
    }

    const projects = await qb.getRawMany();

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
        'user.heightMeters AS "heightMeters"',
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
      heightMeters: user.heightMeters,
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
    const entity = await this.projectRepository.findOne({ where: { idProject }, relations: ['city'] });

    if (!entity) {
      return null;
    }

    const { projectName, projectDescription, startDate, endDate, cityName, provinceName } = updateProjectDto;

    if (cityName && provinceName) {
      const city = await this.cityRepository.findOne({
        where: { cityName, province: { provinceName } },
        relations: ['province'],
      });
      if (!city) {
        throw new NotFoundException('City or province not found');
      }
      entity.city = city;
    }

    if (projectName) entity.projectName = projectName;
    if (projectDescription) entity.projectDescription = projectDescription;
    if (startDate) entity.startDate = startDate;
    if (endDate) entity.endDate = endDate;

    return this.projectRepository.save(entity);
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

  async findProject(idProject: number, idUser?: number, role?: string): Promise<ReadProjectDto | null> {
    const qb = this.projectRepository
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
      ]);

    if (role === 'gestor') {
      qb.innerJoin('project.user', 'creator').andWhere('creator.idUser = :idUser', { idUser });
    } else if (role === 'inspector') {
      qb.innerJoin('project.projectUsers', 'pu').andWhere('pu.userId = :idUser', { idUser });
    }

    const project = await qb.getRawOne();

    if (!project) {
      if (role === 'gestor' || role === 'inspector') {
        throw new ForbiddenException('No tienes acceso a este proyecto');
      }
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
