import { Controller, Get, Post, Body, Param, Delete, Put, Query, Request } from '@nestjs/common';
import { TreeService } from './tree.service';
import { CreateTreeDto } from './dto/create-tree.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/role/role.decorator';

@ApiTags('Tree')
@Roles('administrador', 'gestor')
@Controller('project/:idProject/tree')
export class TreeController {
  constructor(private readonly treeService: TreeService) {}

  // CREATE a new tree for a specific project
  @ApiOperation({ summary: '#M101: Crea un nuevo arbol para un proyecto específico' })
  @Roles('administrador', 'gestor', 'inspector')
  @Post()
  async createTree(@Body() createTreeDto: CreateTreeDto) {
    return this.treeService.createTree(createTreeDto);
  }

  // READ, Fetch all trees associated with a specific project, but only general atributes not specific
  @ApiOperation({ summary: '#M102: Busca todos los árboles por ID de Proyecto' })
  @Roles('administrador', 'gestor', 'inspector')
  @Get()
  async findAllTreesByIdProject(
    @Param('idProject') idProject: number,
    @Query('idUnitWork') idUnitWork: number,
    @Request() req: { user: { idUser: number; role: string } },
  ) {
    return this.treeService.findAllTreesByIdProject(idProject, idUnitWork, req.user.idUser, req.user.role);
  }

  @ApiOperation({ summary: '#M103: Obtener las coordenadas de los árboles por ID de Proyecto' })
  @Get('coordinates')
  async getCoordinatesTreesByIdProject(@Param('idProject') idProject: number) {
    return this.treeService.getCoordinatesTreesByIdProject(idProject);
  }

  // READ, Fetch a specific tree with all the properties includes relationship by idTree
  @ApiOperation({ summary: '#M104: Obtiene un árbol por ID' })
  @Roles('administrador', 'gestor', 'inspector')
  @Get(':idTree')
  async getTreeById(@Param('idTree') idTree: number) {
    return this.treeService.findTreeById(idTree);
  }

  @ApiOperation({ summary: '#M105: Actualiza un  arbol por ID' })
  @Roles('administrador', 'gestor', 'inspector')
  @Put(':idTree')
  async updateTreeById(@Param('idTree') idTree: number, @Body() updateTreeDto: CreateTreeDto) {
    return this.treeService.updateTreeById(idTree, updateTreeDto); // Convert id to number and pass it to the service
  }

  //DELETE tree by id
  @ApiOperation({ summary: '#M106: Borra un arbol por ID' })
  @Delete(':idTree')
  async removeTreeById(@Param('idTree') idTree: number) {
    return this.treeService.removeTreeById(idTree);
  }

  @ApiOperation({ summary: '#M107: Obtiene los datos para poblar los filtros por proyecto y UdT' })
  @Get(':idUnitWork/get-all-filters')
  async getAllFiltersByProjectAndNeighborhood(
    @Param('idUnitWork') idUnitWork: number,
    @Param('idProject') idProject: number,
    @Query('filterNames') filterNames: string,
  ) {
    const filterNamesArray = filterNames ? filterNames.split(',') : [];
    return this.treeService.getFiltersByProjectAndNeighborhood(idProject, idUnitWork, filterNamesArray);
  }

  @ApiOperation({ summary: '#M108: Obtiene todos los árboles filtrados' })
  @Post('filtered-trees')
  async getFilteredTrees(
    @Param('idProject') idProject: number,
    @Body() body: { filters: Record<string, string[]>; neighborhoodIds?: number[] },
  ) {
    const result = await this.treeService.getFilteredTrees(idProject, body.filters ?? {}, body.neighborhoodIds);
    return result;
  }
}
