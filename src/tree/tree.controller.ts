import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { TreeService } from './tree.service';
import { CreateTreeDto } from './dto/create-tree.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Tree')
@Controller('project/:idProject/tree')
export class TreeController {
  constructor(private readonly treeService: TreeService) {}

  // CREATE a new tree for a specific project
  @ApiOperation({ summary: '#M101: Crea un nuevo arbol para un proyecto específico' })
  @Post()
  async createTree(@Body() createTreeDto: CreateTreeDto) {
    return this.treeService.createTree(createTreeDto);
  }

  // READ, Fetch all trees associated with a specific project, but only general atributes not specific
  @ApiOperation({ summary: '#M102: Busca todos los árboles por ID de Proyecto' })
  @Get()
  async findAllTreesByIdProject(@Param('idProject') idProject: number) {
    return this.treeService.findAllTreesByIdProject(idProject);
  }

  @ApiOperation({ summary: '#M103: Obtener las coordenadas de los árboles por ID de Proyecto' })
  @Get('coordinates')
  async getCoordinatesTreesByIdProject(@Param('idProject') idProject: number) {
    return this.treeService.getCoordinatesTreesByIdProject(idProject);
  }

  // READ, Fetch a specific tree with all the properties includes relationship by idTree
  @ApiOperation({ summary: '#M104: Obtiene un árbol por ID' })
  @Get(':idTree')
  async getTreeById(@Param('idTree') idTree: number) {
    return this.treeService.findTreeById(idTree);
  }

  @ApiOperation({ summary: '#M105: Actualiza un  arbol por ID' })
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
  @Get(':idUnitWork/filtered-trees')
  async getFilteredTrees(
    @Param('idUnitWork') idUnitWork: number,
    @Param('idProject') idProject: number,
    @Query('filterNames') filterNames: string,
  ) {
    const filterNamesArray = filterNames ? filterNames.split(',') : [];
    return this.treeService.getFilteredTrees(idProject, idUnitWork, filterNamesArray);
  }

  // @Get(':idUnitWork/get-trees-and-neighborhood')
  // async getTreesAndNeighborhood(@Param('idUnitWork') idUnitWork: number, @Param('idProject') idProject: number): Promise<TreeRequestData> {
  //   const treeData = await this.treeService.getTreesData(idProject, idUnitWork);
  //   const neighborhoodData = await this.treeService.getNeighborhoodData(idProject, idUnitWork);

  //   return this.treeService.getTreesAndNeighborhood(treeData, neighborhoodData);
  // }
}
