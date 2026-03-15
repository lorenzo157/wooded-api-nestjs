import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provinces } from './entities/Provinces';
import { Cities } from './entities/Cities';
import { Neighborhoods } from '../unitwork/entities/Neighborhoods';
import { Coordinates } from './entities/Coordinates';
import { CreateNeighborhoodDto } from '../user/dto/create-neighborhood.dto';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Provinces) private readonly provinceRepository: Repository<Provinces>,
    @InjectRepository(Cities) private readonly cityRepository: Repository<Cities>,
    @InjectRepository(Neighborhoods) private readonly neighborhoodRepository: Repository<Neighborhoods>,
    @InjectRepository(Coordinates) private readonly coordinateRepository: Repository<Coordinates>,
  ) {}

  async findAllProvinces() {
    const provinces = await this.provinceRepository
      .createQueryBuilder('province')
      .select(['province.provinceName AS "provinceName"', 'province.idProvince AS "idProvince"'])
      .orderBy('province.provinceName')
      .getRawMany();

    if (!provinces) {
      return null;
    }
    return provinces;
  }

  async findAllCitiesByProvince(provinceName: string) {
    const cities = await this.provinceRepository
      .createQueryBuilder('province')
      .innerJoinAndSelect('province.cities', 'city')
      .where('province.provinceName = :provinceName', { provinceName })
      .select(['city.idCity AS "idCity"', 'city.cityName AS "cityName"'])
      .orderBy('city.cityName')
      .groupBy('city.idCity')
      .getRawMany();

    return cities;
  }

  async findAllNeighborhoods() {
    const neighborhoods = await this.neighborhoodRepository.find({
      where: { deletedAt: null },
      relations: ['city', 'city.province', 'coordinates'],
    });

    return neighborhoods.map((n) => ({
      idNeighborhood: n.idNeighborhood,
      neighborhoodName: n.neighborhoodName,
      provinceName: n.city?.province?.provinceName ?? null,
      cityName: n.city?.cityName ?? null,
      numBlocksInNeighborhood: n.numBlocksInNeighborhood,
      coordinates: n.coordinates?.map((c) => ({ latitude: c.latitude, longitude: c.longitude })) ?? [],
    }));
  }

  async createNeighborhood(createNeighborhoodDto: CreateNeighborhoodDto) {
    const city = await this.cityRepository.findOne({
      where: { cityName: createNeighborhoodDto.cityName, province: { provinceName: createNeighborhoodDto.provinceName } },
      relations: ['province'],
    });

    if (!city) {
      throw new BadRequestException('City not found');
    }

    const newNeighborhood = await this.neighborhoodRepository.save({
      city: city,
      neighborhoodName: createNeighborhoodDto.neighborhoodName,
      numBlocksInNeighborhood: createNeighborhoodDto.numBlocksInNeighborhood,
    });

    for (const coordinate of createNeighborhoodDto.coordinates) {
      await this.coordinateRepository.save({
        neighborhood: newNeighborhood,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });
    }

    // Close polygon ring
    await this.coordinateRepository.save({
      neighborhood: newNeighborhood,
      latitude: createNeighborhoodDto.coordinates[0].latitude,
      longitude: createNeighborhoodDto.coordinates[0].longitude,
    });

    return true;
  }

  async removeNeighborhoodById(idNeighborhood: number) {
    const neighborhood = await this.neighborhoodRepository.findOne({
      where: { idNeighborhood },
      relations: ['unitWorks'],
    });

    if (!neighborhood) {
      throw new NotFoundException('Neighborhood not found');
    }

    if (neighborhood.unitWorks?.length > 0) {
      throw new BadRequestException('Cannot delete neighborhood with associated unit works');
    }

    await this.coordinateRepository.delete({ neighborhood: { idNeighborhood } });
    await this.neighborhoodRepository.delete(idNeighborhood);
    return true;
  }
}
