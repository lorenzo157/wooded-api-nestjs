import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { CreateNeighborhoodDto } from '../user/dto/create-neighborhood.dto';
import { Roles } from '../auth/role/role.decorator';

@ApiTags('Location')
@Roles('administrador', 'gestor')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @ApiOperation({ summary: 'Obtiene todas las provincias' })
  @Get('provinces')
  async findAllProvinces() {
    return this.locationService.findAllProvinces();
  }

  @ApiOperation({ summary: 'Obtiene todas las ciudades por nombre de provincia' })
  @Get('cities/:provinceName')
  async findAllCitiesByProvince(@Param('provinceName') provinceName: string) {
    return this.locationService.findAllCitiesByProvince(provinceName);
  }

  @ApiOperation({ summary: 'Obtiene todos los barrios con sus coordenadas' })
  @Get('neighborhoods')
  async findAllNeighborhoods() {
    return this.locationService.findAllNeighborhoods();
  }

  @ApiOperation({ summary: 'Crea un nuevo barrio' })
  @Roles('administrador')
  @Post('neighborhood')
  async createNeighborhood(@Body() createNeighborhoodDto: CreateNeighborhoodDto) {
    return this.locationService.createNeighborhood(createNeighborhoodDto);
  }

  @ApiOperation({ summary: 'Elimina un barrio por ID (solo si no tiene unidades de trabajo)' })
  @Roles('administrador')
  @Delete('neighborhood/:idNeighborhood')
  async removeNeighborhoodById(@Param('idNeighborhood') idNeighborhood: number) {
    return this.locationService.removeNeighborhoodById(idNeighborhood);
  }
}
