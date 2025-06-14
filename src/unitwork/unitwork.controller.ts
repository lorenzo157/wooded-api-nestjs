import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UnitWorkService } from './unitwork.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { UnitWork } from './entities/UnitWork';
import { ReadUnitWorkDto } from './dto/read-unitwork.dto';
import { SampleDataDto } from './dto/sample-data.dto';
import { ReadFilterDto } from '../project/dto/read-filter.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('UnitWork')
@Controller('project/:idProject/unitwork/:idUnitWork')
export class UnitWorkController {
  constructor(private readonly unitworkService: UnitWorkService) {}

  // Endpoint to fetch unit work assigned with the idProject
  @ApiOperation({ summary: '#M401: Busca todas las Unidades de Trabajo por ID de proyecto' })
  @Get()
  async findAllUnitWorksByIdProject(@Param('idProject') idProject: number): Promise<ReadUnitWorkDto[]> {
    return this.unitworkService.findAllUnitWorksByIdProject(idProject);
  }

  // Generate unitwork for current project
  @ApiOperation({ summary: '#M402: Genera las Unidades de Trabajo por ID de proyecto' })
  @Post()
  async generateUnitWorksToProject(@Param('idProject') idProject: number) {
    const generateUnitWorks = await this.unitworkService.generateUnitWorksToProject(idProject);
    if (!generateUnitWorks) {
      return false;
    } else {
      return true;
    }
  }

  // Create campaign
  @ApiOperation({ summary: '#M403: Crea una nueva campaña' })
  @Post('campaign')
  async createCampaign(@Param('idUnitWork') idUnitWork: number, @Body() campaignDescription: CreateCampaignDto) {
    return this.unitworkService.createCampaign(idUnitWork, campaignDescription);
  }

  // Endpoint to fetch all the campaigns associated with the idUnitWork
  @ApiOperation({ summary: '#M404: Busca todas las campañas por ID de Unidad de Trabajo' })
  @Get('campaign')
  async findAllCampaignsByIdUnitWork(@Param('idUnitWork') idUnitWork: number): Promise<ReadUnitWorkDto[]> {
    return this.unitworkService.findAllCampaignsByUnitWork(idUnitWork);
  }

  @ApiOperation({ summary: '#M405: Busca la desviacion estandar de la Unidad de Trabajo (barrio)' })
  @Get('stdev-trees-in-blocks')
  async calculateStandardDeviation(@Param('idProject') idProject: number, @Param('idUnitWork') idUnitWork: number) {
    return this.unitworkService.calculateStandardDeviation(idProject, idUnitWork);
  }

  @ApiOperation({ summary: '#M406: Obtiene la media de arboles por ID de Proyecto (individual o unidad de trabajo)' })
  @Get('mean-trees-in-block')
  async getMeanOfTreesInBlock(@Param('idProject') idProject: number, @Param('idUnitWork') idUnitWork: number) {
    return this.unitworkService.getMeanOfTreesInBlock(idProject, idUnitWork);
  }

  @ApiOperation({ summary: '#M407: Calcula la cantidad de arboles de Proyecto y Unidad de Trabajo' })
  @Get('qty-trees-in-population')
  async getMeanOfNeighborhood(@Param('idProject') idProject: number, @Param('idUnitWork') idUnitWork: number) {
    return this.unitworkService.getTreesQtyPopulationInNeighborhoodUW(idUnitWork, idProject);
  }

  @ApiOperation({ summary: '#M408: Busca los árboles por Unidad de Trabajo' })
  @Get('trees-of-unitwork')
  async findTreesByUnitWork(@Param('idUnitWork') idUnitWork: number) {
    return this.unitworkService.getTreesByUnitWork(idUnitWork);
  }

  @ApiOperation({ summary: '#M409: Actualiza Campaña por ID' })
  @Patch('campaign/:idCampaign')
  async updateCampaignById(@Param('idCampaign') idCampaign: number, @Body() updateCampaignDto: UpdateCampaignDto) {
    return this.unitworkService.updateCampaignById(idCampaign, updateCampaignDto);
  }

  @ApiOperation({ summary: '#M410: Elimina Campaña por ID' })
  @Delete('campaign/:idCampaign')
  async removeCampaignById(@Param('idCampaign') idCampaign: number) {
    return this.unitworkService.removeCampaignById(idCampaign);
  }

  @ApiOperation({ summary: '#M411: Busca campaña por ID de Campaña' })
  @Get('campaign/:idCampaign')
  async getCampaignById(@Param('idCampaign') idCampaign: number): Promise<ReadUnitWorkDto> {
    return this.unitworkService.getCampaignById(idCampaign);
  }

  @ApiOperation({ summary: '#M412: Calcula los valores del trabajo restante de la Unidad de Trabajo' })
  @Get('calculate')
  async calculateUnitWorkThroughCampaigns(@Param('idUnitWork') idUnitWork: number): Promise<ReadUnitWorkDto> {
    return this.unitworkService.calculateDataOfUnitWorkThroughCampaigns(idUnitWork);
  }

  @ApiOperation({ summary: '#M413: Calcula los valores del trabajo restante de la Unidad de Trabajo' })
  @Get('apply-filters')
  async applyFilters(@Param('idProject') idProject: number, @Param('idUnitWork') idUnitWork: number, @Body() readFilterDto: ReadFilterDto) {
    return this.unitworkService.applyFilters(idProject, idUnitWork, readFilterDto);
  }

  @ApiOperation({ summary: '#M414: Busca los arboles por ID de Unidad de Trabajo' })
  @Get('trees')
  async findAllTreesByUnitWork(@Param('idProject') idProject: number, @Param('idUnitWork') idUnitWork: number) {
    const trees = this.unitworkService.findAllTreesByUnitWork(idProject, idUnitWork);
    return trees;
  }

  @ApiOperation({ summary: '#M415: Obtiene las coordenadas del barrio para graficar el contorno' })
  @Get('neighborhood-coordinates')
  async getCoordinatesOfNeighborhood(@Param('idUnitWork') idUnitWork: number) {
    return this.unitworkService.getCoordinatesOfNeighborhood(idUnitWork);
  }
}
