import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ReadUserDto } from '../user/dto/read-user.dto';
import { ReadProjectDto } from './dto/read-project.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/role/role.decorator';

@ApiTags('Project')
@Roles('administrador', 'gestor')
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  // Create a new project in web application and assigned it with creator user

  @ApiOperation({ summary: '#M201: Crea un nuevo proyecto' })
  @Post()
  async createProject(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.createProject(createProjectDto);
  }

  // Endpoint to fetch all the projects that have been assigned with "inspector" user in movil aplication
  @ApiOperation({ summary: '#M202: Busca todos los proyectos asignados al ID de Usuario' })
  @Roles('administrador', 'gestor', 'inspector')
  @Get('assignedproject')
  async findAllAssignedProjectsToUser(@Request() req: { user: { idUser: number } }) {
    return this.projectService.findAllAssignedProjectsToUser(req.user.idUser);
  }

  // Endpoint to fetch projects that have been created by "gestor" or "adiministrador" users in web application
  @ApiOperation({ summary: '#M203: Busca todos los proyectos creados por el ID de Usuario' })
  @Get('createdproject')
  async findAllCreatedProjectsByUser(@Request() req: { user: { idUser: number; role: string } }) {
    return this.projectService.findAllCreatedProjectsByUser(req.user.idUser, req.user.role);
  }

  @ApiOperation({ summary: '#M204: Busca todos los usuarios asignados al Proyecto' })
  @Get(':idProject/assigneduser')
  async findAllAssignedUsersWithProject(@Param('idProject') idProject: number): Promise<ReadUserDto[]> {
    return this.projectService.findAllAssignedUsersWithProject(idProject);
  }

  @ApiOperation({ summary: '#M205: Busca los datos del proyecto por ID' })
  @Roles('administrador', 'gestor', 'inspector')
  @Get(':idProject')
  async findProject(
    @Param('idProject') idProject: number,
    @Request() req: { user: { idUser: number; role: string } },
  ): Promise<ReadProjectDto> {
    return this.projectService.findProject(idProject, req.user.idUser, req.user.role);
  }

  @ApiOperation({ summary: '#M206: Asigna un nuevo usuario al proyecto' })
  @Post(':idProject/assigneduser/:idUser')
  async assignUserToProject(@Param('idProject') idProject: number, @Param('idUser') idUser: number) {
    return this.projectService.assignUserToProject(idProject, idUser);
  }

  @ApiOperation({ summary: '#M207: Quita usuario del proyecto' })
  @Delete(':idProject/assigneduser/:idUser')
  async removeUserFromProject(@Param('idProject') idProject: number, @Param('idUser') idUser: number) {
    return this.projectService.removeUserFromProject(idProject, idUser);
  }

  @ApiOperation({ summary: '#M208: Actualiza proyecto' })
  @Patch(':idProject')
  async updateProjectById(@Param('idProject') idProject: number, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectService.updateProjectById(idProject, updateProjectDto);
  }

  @ApiOperation({ summary: '#M209: Borra el proyecto' })
  @Delete(':idProject')
  async removeProjectById(@Param('idProject') idProject: number) {
    return this.projectService.removeProjectById(idProject);
  }

  @ApiOperation({ summary: '#M210: Obtiene los árboles por ID de proyecto' })
  @Get('trees/:idProject')
  async getTreesByIdProject(@Param('idProject') idProject: number) {
    return this.projectService.findTresByIdProject(idProject);
  }

  @ApiOperation({ summary: '#M211: Obtiene el ID de Usuario creador del proyecto' })
  @Get(':idProject/user')
  async getIdUserByIdProject(@Param('idProject') idProject: number) {
    return this.projectService.getIdUserByIdProject(idProject);
  }

  @ApiOperation({ summary: '#M212: Obtiene los barrios con sus coordenadas de polígono por ID de proyecto' })
  @Get('get-neighborhood-data-of-project/:idProject')
  async getNeighborhoodDataByProject(@Param('idProject') idProject: number) {
    return this.projectService.getNeighborhoodDataByProject(idProject);
  }
}
