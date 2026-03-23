import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { UnitWork } from './entities/UnitWork';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ReadUnitWorkDto } from './dto/read-unitwork.dto';
import { ReadCampaignDto } from './dto/read-campaign.dto';

import { SampleDataDto } from './dto/sample-data.dto';
import { ReadFilterDto } from '../project/dto/read-filter.dto';
import { Coordinates } from '../location/entities/Coordinates';
import { TreeService } from '../tree/tree.service';
@Injectable()
export class UnitWorkService {
  private sampleDataDto: SampleDataDto;
  constructor(
    @InjectRepository(UnitWork) private readonly unitWorkRepository: Repository<UnitWork>,
    @InjectRepository(Coordinates) private readonly coordinatesRepository: Repository<Coordinates>,
    @Inject(forwardRef(() => TreeService)) private readonly treeService: TreeService,
    private readonly dataSource: DataSource,
  ) {
    this.sampleDataDto = {
      treeMeanByNeighborhood: 0,
      treeQty: 0,
      pruningTrainingPercentage: 0,
      pruningSanitaryPercentage: 0,
      pruningHeightReductionPercentage: 0,
      pruningBranchThinningPercentage: 0,
      pruningSignClearingPercentage: 0,
      pruningPowerLineClearingPercentage: 0,
      pruningRootDeflectorsPercentage: 0,
      cablingPercentage: 0,
      fasteningPercentage: 0,
      proppingPercentage: 0,
      permeableSurfaceIncreasesPercentage: 0,
      moveTargetPercentage: 0,
      restrictAccessPercentage: 0,
      fertilizationsPercentage: 0,
      descompressionPercentage: 0,
      drainsPercentage: 0,
      extractionsPercentage: 0,
      plantationsPercentage: 0,
      openingsPotPercentage: 0,
      advancedInspectionsPercentage: 0,
    };
  }

  async findAllUnitWorksByIdProject(idProject: number): Promise<ReadUnitWorkDto[]> {
    const unitWorks = await this.unitWorkRepository
      .createQueryBuilder('unit_work')
      .innerJoinAndSelect('unit_work.neighborhood', 'neighborhood')
      .innerJoinAndSelect('neighborhood.city', 'city')
      .innerJoinAndSelect('city.province', 'province')
      .where('unit_work.project.idProject = :idProject', { idProject })
      .andWhere('unit_work.unitWork_2 is null')
      .select([
        'unit_work.idUnitWork AS "idUnitWork"',
        'unit_work.projectId AS "projectId"',
        'unit_work.neighborhoodId AS "neighborhoodId"',
        'neighborhood.neighborhoodName AS "neighborhoodName"',
        'neighborhood.numBlocksInNeighborhood AS "numBlocksInNeighborhood"',
        'city.cityName AS "cityName"',
        'province.provinceName AS "provinceName"',
        'unit_work.pruningTraining AS "pruningTraining"',
        'unit_work.pruningSanitary AS "pruningSanitary"',
        'unit_work.pruningHeightReduction AS "pruningHeightReduction"',
        'unit_work.pruningBranchThinning AS "pruningBranchThinning"',
        'unit_work.pruningSignClearing AS "pruningSignClearing"',
        'unit_work.pruningPowerLineClearing AS "pruningPowerLineClearing"',
        'unit_work.pruningRootDeflectors AS "pruningRootDeflectors"',
        'unit_work.cabling AS "cabling"',
        'unit_work.fastening AS "fastening"',
        'unit_work.propping AS "propping"',
        'unit_work.permeableSurfaceIncreases AS "permeableSurfaceIncreases"',
        'unit_work.restrictAccess AS "restrictAccess"',
        'unit_work.moveTarget AS "moveTarget"',
        'unit_work.fertilizations AS "fertilizations"',
        'unit_work.descompression AS "descompression"',
        'unit_work.drains AS "drains"',
        'unit_work.extractions AS "extractions"',
        'unit_work.plantations AS "plantations"',
        'unit_work.openingsPot AS "openingsPot"',
        'unit_work.advancedInspections AS "advancedInspections"',
        'unit_work.campaignDescription AS "campaignDescription"',
      ])
      .getRawMany();

    return unitWorks.map((unitWork) => ({
      idUnitWork: unitWork.idUnitWork,
      projectId: unitWork.projectId,
      neighborhoodId: unitWork.neighborhoodId,
      neighborhoodName: unitWork.neighborhoodName,
      numBlocksInNeighborhood: unitWork.numBlocksInNeighborhood,
      cityName: unitWork.cityName,
      provinceName: unitWork.provinceName,
      pruningTraining: unitWork.pruningTraining,
      pruningSanitary: unitWork.pruningSanitary,
      pruningHeightReduction: unitWork.pruningHeightReduction,
      pruningBranchThinning: unitWork.pruningBranchThinning,
      pruningSignClearing: unitWork.pruningSignClearing,
      pruningPowerLineClearing: unitWork.pruningPowerLineClearing,
      pruningRootDeflectors: unitWork.pruningRootDeflectors,
      cabling: unitWork.cabling,
      fastening: unitWork.fastening,
      propping: unitWork.propping,
      permeableSurfaceIncreases: unitWork.permeableSurfaceIncreases,
      moveTarget: unitWork.moveTarget,
      restrictAccess: unitWork.restrictAccess,
      fertilizations: unitWork.fertilizations,
      descompression: unitWork.descompression,
      drains: unitWork.drains,
      extractions: unitWork.extractions,
      plantations: unitWork.plantations,
      openingsPot: unitWork.openingsPot,
      advancedInspections: unitWork.advancedInspections,
      campaignDescription: unitWork.campaignDescription,
    }));
  }

  async findUnitWorkById(idUnitWork: number): Promise<ReadUnitWorkDto> {
    const unitWork = await this.unitWorkRepository
      .createQueryBuilder('unit_work')
      .innerJoinAndSelect('unit_work.neighborhood', 'neighborhood')
      .innerJoinAndSelect('neighborhood.city', 'city')
      .innerJoinAndSelect('city.province', 'province')
      .where('unit_work.idUnitWork = :idUnitWork', { idUnitWork })
      .andWhere('unit_work.unitWork_2 is null')
      .select([
        'unit_work.idUnitWork AS "idUnitWork"',
        'unit_work.projectId AS "projectId"',
        'unit_work.neighborhoodId AS "neighborhoodId"',
        'neighborhood.neighborhoodName AS "neighborhoodName"',
        'neighborhood.numBlocksInNeighborhood AS "numBlocksInNeighborhood"',
        'city.cityName AS "cityName"',
        'province.provinceName AS "provinceName"',
        'unit_work.pruningTraining AS "pruningTraining"',
        'unit_work.pruningSanitary AS "pruningSanitary"',
        'unit_work.pruningHeightReduction AS "pruningHeightReduction"',
        'unit_work.pruningBranchThinning AS "pruningBranchThinning"',
        'unit_work.pruningSignClearing AS "pruningSignClearing"',
        'unit_work.pruningPowerLineClearing AS "pruningPowerLineClearing"',
        'unit_work.pruningRootDeflectors AS "pruningRootDeflectors"',
        'unit_work.cabling AS "cabling"',
        'unit_work.fastening AS "fastening"',
        'unit_work.propping AS "propping"',
        'unit_work.permeableSurfaceIncreases AS "permeableSurfaceIncreases"',
        'unit_work.restrictAccess AS "restrictAccess"',
        'unit_work.moveTarget AS "moveTarget"',
        'unit_work.fertilizations AS "fertilizations"',
        'unit_work.descompression AS "descompression"',
        'unit_work.drains AS "drains"',
        'unit_work.extractions AS "extractions"',
        'unit_work.plantations AS "plantations"',
        'unit_work.openingsPot AS "openingsPot"',
        'unit_work.advancedInspections AS "advancedInspections"',
        'unit_work.campaignDescription AS "campaignDescription"',
      ])
      .getRawOne();

    if (!unitWork) {
      throw new NotFoundException('UnitWork not found');
    }

    return {
      idUnitWork: unitWork.idUnitWork,
      projectId: unitWork.projectId,
      neighborhoodId: unitWork.neighborhoodId,
      neighborhoodName: unitWork.neighborhoodName,
      numBlocksInNeighborhood: unitWork.numBlocksInNeighborhood,
      cityName: unitWork.cityName,
      provinceName: unitWork.provinceName,
      pruningTraining: unitWork.pruningTraining,
      pruningSanitary: unitWork.pruningSanitary,
      pruningHeightReduction: unitWork.pruningHeightReduction,
      pruningBranchThinning: unitWork.pruningBranchThinning,
      pruningSignClearing: unitWork.pruningSignClearing,
      pruningPowerLineClearing: unitWork.pruningPowerLineClearing,
      pruningRootDeflectors: unitWork.pruningRootDeflectors,
      cabling: unitWork.cabling,
      fastening: unitWork.fastening,
      propping: unitWork.propping,
      permeableSurfaceIncreases: unitWork.permeableSurfaceIncreases,
      moveTarget: unitWork.moveTarget,
      restrictAccess: unitWork.restrictAccess,
      fertilizations: unitWork.fertilizations,
      descompression: unitWork.descompression,
      drains: unitWork.drains,
      extractions: unitWork.extractions,
      plantations: unitWork.plantations,
      openingsPot: unitWork.openingsPot,
      advancedInspections: unitWork.advancedInspections,
      campaignDescription: unitWork.campaignDescription,
    };
  }

  async generateUnitWorksToProject(idProject: number) {
    const neighborhoods = await this.treeService.getNeighborhoodsByProject(idProject);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const neighborhood of neighborhoods) {
        const { idNeighborhood, numBlocksInNeighborhood, treesInNeighborhood, averageTreesInBlock } = neighborhood;

        if (!treesInNeighborhood) {
          throw new Error(`No trees found for neighborhood ID: ${idNeighborhood}`);
        }

        // avg(treesInTheBlock) * numBlocksInNeighborhood = estimated total trees in neighborhood
        console.log(' averageTreesInBlock:', averageTreesInBlock);
        const estimatedTotalTreesInNeighborhood = averageTreesInBlock * numBlocksInNeighborhood;
        console.log(' estimatedTotalTreesInNeighborhood:', estimatedTotalTreesInNeighborhood);

        const ic = await this.treeService.countAllInterventionsByNeighborhood(
          idProject,
          idNeighborhood,
          treesInNeighborhood,
          estimatedTotalTreesInNeighborhood,
        );

        const newUnitWork = queryRunner.manager.create(UnitWork, {
          projectId: idProject,
          neighborhoodId: idNeighborhood,
          pruningTraining: ic['poda (formacion)'],
          pruningSanitary: ic['poda (sanitaria)'],
          pruningHeightReduction: ic['poda (reduccion de altura)'],
          pruningBranchThinning: ic['poda (raleo de ramas)'],
          pruningSignClearing: ic['poda (despeje de señaletica)'],
          pruningPowerLineClearing: ic['poda (despeje de conductores electricos)'],
          pruningRootDeflectors: ic['poda (radicular + uso de deflectores)'],
          restrictAccess: ic['restringir acceso'],
          moveTarget: ic['mover el blanco'],
          cabling: ic['cableado'],
          fastening: ic['sujecion'],
          propping: ic['apuntalamiento'],
          permeableSurfaceIncreases: ic['aumentar superficie permeable'],
          fertilizations: ic['fertilizacion'],
          descompression: ic['descompactado'],
          drains: ic['drenaje'],
          extractions: ic['extraccion del arbol'],
          plantations: ic['plantacion de arbol faltante'],
          openingsPot: ic['abertura de cazuela en vereda'],
          advancedInspections: ic['requiere inspeccion avanzada'],
          campaignDescription: null,
        });

        await queryRunner.manager.save(newUnitWork);
      }

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createCampaign(idUnitWork: number, campaignDescription: CreateCampaignDto) {
    const unitwork = await this.unitWorkRepository.findOne({
      // find u_k father
      where: { idUnitWork: idUnitWork },
    });

    if (!unitwork) {
      return null;
    }

    const newCampaign = this.unitWorkRepository.create({
      campaignDescription: campaignDescription.campaignDescription,
      unitWork_2: unitwork,
    });
    return this.unitWorkRepository.save(newCampaign);
  }

  async updateCampaignById(idCampaign: number, updateCampaignDto: UpdateCampaignDto) {
    const campaign = await this.unitWorkRepository.findOne({
      where: { idUnitWork: idCampaign },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const {
      campaignDescription,
      pruningTraining,
      pruningSanitary,
      pruningHeightReduction,
      pruningBranchThinning,
      pruningSignClearing,
      pruningPowerLineClearing,
      pruningRootDeflectors,
      cabling,
      fastening,
      propping,
      permeableSurfaceIncreases,
      moveTarget,
      restrictAccess,
      fertilizations,
      descompression,
      drains,
      extractions,
      plantations,
      openingsPot,
      advancedInspections,
    } = updateCampaignDto;

    const add = (current: number, increment: number): number => {
      if (!increment) return current;
      return (current || 0) + increment;
    };

    const partialUpdate = {
      campaignDescription,
      pruningTraining: add(campaign.pruningTraining, pruningTraining),
      pruningSanitary: add(campaign.pruningSanitary, pruningSanitary),
      pruningHeightReduction: add(campaign.pruningHeightReduction, pruningHeightReduction),
      pruningBranchThinning: add(campaign.pruningBranchThinning, pruningBranchThinning),
      pruningSignClearing: add(campaign.pruningSignClearing, pruningSignClearing),
      pruningPowerLineClearing: add(campaign.pruningPowerLineClearing, pruningPowerLineClearing),
      pruningRootDeflectors: add(campaign.pruningRootDeflectors, pruningRootDeflectors),
      cabling: add(campaign.cabling, cabling),
      fastening: add(campaign.fastening, fastening),
      propping: add(campaign.propping, propping),
      permeableSurfaceIncreases: add(campaign.permeableSurfaceIncreases, permeableSurfaceIncreases),
      moveTarget: add(campaign.moveTarget, moveTarget),
      restrictAccess: add(campaign.restrictAccess, restrictAccess),
      fertilizations: add(campaign.fertilizations, fertilizations),
      descompression: add(campaign.descompression, descompression),
      drains: add(campaign.drains, drains),
      extractions: add(campaign.extractions, extractions),
      plantations: add(campaign.plantations, plantations),
      openingsPot: add(campaign.openingsPot, openingsPot),
      advancedInspections: add(campaign.advancedInspections, advancedInspections),
    };

    const result = await this.unitWorkRepository.update(idCampaign, partialUpdate);

    if (result.affected === 0) {
      throw new NotFoundException('Invalid update');
    }

    return this.unitWorkRepository.findOne({ where: { idUnitWork: idCampaign } });
  }

  async findAllCampaignsByUnitWork(idUnitWork: number): Promise<ReadCampaignDto[]> {
    const unitWorks = await this.unitWorkRepository
      .createQueryBuilder('unit_work')
      .where('unit_work.unitWork_2 = :idUnitWork', { idUnitWork })
      .select([
        'unit_work.idUnitWork AS "idUnitWork"',
        'unit_work.pruningTraining AS "pruningTraining"',
        'unit_work.pruningSanitary AS "pruningSanitary"',
        'unit_work.pruningHeightReduction AS "pruningHeightReduction"',
        'unit_work.pruningBranchThinning AS "pruningBranchThinning"',
        'unit_work.pruningSignClearing AS "pruningSignClearing"',
        'unit_work.pruningPowerLineClearing AS "pruningPowerLineClearing"',
        'unit_work.pruningRootDeflectors AS "pruningRootDeflectors"',
        'unit_work.cabling AS "cabling"',
        'unit_work.propping AS "propping"',
        'unit_work.fastening AS "fastening"',
        'unit_work.permeableSurfaceIncreases AS "permeableSurfaceIncreases"',
        'unit_work.moveTarget AS "moveTarget"',
        'unit_work.restrictAccess AS "restrictAccess"',
        'unit_work.fertilizations AS "fertilizations"',
        'unit_work.descompression AS "descompression"',
        'unit_work.drains AS "drains"',
        'unit_work.extractions AS "extractions"',
        'unit_work.plantations AS "plantations"',
        'unit_work.openingsPot AS "openingsPot"',
        'unit_work.advancedInspections AS "advancedInspections"',
        'unit_work.campaignDescription AS "campaignDescription"',
      ])
      .orderBy('unit_work.idUnitWork', 'ASC')
      .getRawMany();

    return unitWorks.map((unitWork) => ({
      idUnitWork: unitWork.idUnitWork,
      pruningTraining: unitWork.pruningTraining,
      pruningSanitary: unitWork.pruningSanitary,
      pruningHeightReduction: unitWork.pruningHeightReduction,
      pruningBranchThinning: unitWork.pruningBranchThinning,
      pruningSignClearing: unitWork.pruningSignClearing,
      pruningPowerLineClearing: unitWork.pruningPowerLineClearing,
      pruningRootDeflectors: unitWork.pruningRootDeflectors,
      cabling: unitWork.cabling,
      fastening: unitWork.fastening,
      propping: unitWork.propping,
      permeableSurfaceIncreases: unitWork.permeableSurfaceIncreases,
      moveTarget: unitWork.moveTarget,
      restrictAccess: unitWork.restrictAccess,
      fertilizations: unitWork.fertilizations,
      descompression: unitWork.descompression,
      drains: unitWork.drains,
      extractions: unitWork.extractions,
      plantations: unitWork.plantations,
      openingsPot: unitWork.openingsPot,
      advancedInspections: unitWork.advancedInspections,
      campaignDescription: unitWork.campaignDescription,
    }));
  }

  async calculateDataOfUnitWorkThroughCampaigns(idUnitWork: number): Promise<ReadUnitWorkDto> {
    const unitWork = await this.unitWorkRepository.findOne({
      where: { idUnitWork },
      relations: ['neighborhood'],
    });

    const campaigns = await this.findAllCampaignsByUnitWork(idUnitWork);

    type NumericField = keyof Omit<ReadCampaignDto, 'idUnitWork' | 'campaignDescription'>;
    const numericFields: NumericField[] = [
      'pruningTraining',
      'pruningSanitary',
      'pruningHeightReduction',
      'pruningBranchThinning',
      'pruningSignClearing',
      'pruningPowerLineClearing',
      'pruningRootDeflectors',
      'cabling',
      'fastening',
      'propping',
      'permeableSurfaceIncreases',
      'restrictAccess',
      'moveTarget',
      'fertilizations',
      'descompression',
      'drains',
      'extractions',
      'plantations',
      'openingsPot',
      'advancedInspections',
    ];

    const remaining = (field: NumericField) => unitWork[field] - campaigns.reduce((sum, c) => sum + c[field], 0);

    return {
      idUnitWork: unitWork.idUnitWork,
      projectId: unitWork.projectId,
      neighborhoodId: unitWork.neighborhoodId,
      neighborhoodName: unitWork.neighborhood.neighborhoodName,
      campaignDescription: unitWork.campaignDescription,
      ...Object.fromEntries(numericFields.map((f) => [f, remaining(f)])),
    } as ReadUnitWorkDto;
  }

  async savePercentages(treeQty: number, updateDto: ReadUnitWorkDto) {
    this.sampleDataDto.treeQty = treeQty;
    this.sampleDataDto.pruningTrainingPercentage = updateDto.pruningTraining / treeQty;
    this.sampleDataDto.pruningSanitaryPercentage = updateDto.pruningSanitary / treeQty;
    this.sampleDataDto.pruningHeightReductionPercentage = updateDto.pruningHeightReduction / treeQty;
    this.sampleDataDto.pruningBranchThinningPercentage = updateDto.pruningBranchThinning / treeQty;
    this.sampleDataDto.pruningSignClearingPercentage = updateDto.pruningSignClearing / treeQty;
    this.sampleDataDto.pruningPowerLineClearingPercentage = updateDto.pruningPowerLineClearing / treeQty;
    this.sampleDataDto.pruningRootDeflectorsPercentage = updateDto.pruningRootDeflectors / treeQty;
    this.sampleDataDto.cablingPercentage = updateDto.cabling / treeQty;
    this.sampleDataDto.fasteningPercentage = updateDto.fastening / treeQty;
    this.sampleDataDto.proppingPercentage = updateDto.propping / treeQty;
    this.sampleDataDto.permeableSurfaceIncreasesPercentage = updateDto.permeableSurfaceIncreases / treeQty;
    this.sampleDataDto.fertilizationsPercentage = updateDto.fertilizations / treeQty;
    this.sampleDataDto.descompressionPercentage = updateDto.descompression / treeQty;
    this.sampleDataDto.drainsPercentage = updateDto.drains / treeQty;
    this.sampleDataDto.extractionsPercentage = updateDto.extractions / treeQty;
    this.sampleDataDto.plantationsPercentage = updateDto.plantations / treeQty;
    this.sampleDataDto.openingsPotPercentage = updateDto.openingsPot / treeQty;
    this.sampleDataDto.advancedInspectionsPercentage = updateDto.advancedInspections / treeQty;

    return this.sampleDataDto;
  }

  async getCampaignById(idCampaign: number): Promise<ReadCampaignDto> {
    const campaign = await this.unitWorkRepository
      .createQueryBuilder('unit_work')
      .where('unit_work.idUnitWork = :idCampaign', { idCampaign })
      .select([
        'unit_work.idUnitWork AS "idUnitWork"',
        'unit_work.pruningTraining AS "pruningTraining"',
        'unit_work.pruningSanitary AS "pruningSanitary"',
        'unit_work.pruningHeightReduction AS "pruningHeightReduction"',
        'unit_work.pruningBranchThinning AS "pruningBranchThinning"',
        'unit_work.pruningSignClearing AS "pruningSignClearing"',
        'unit_work.pruningPowerLineClearing AS "pruningPowerLineClearing"',
        'unit_work.pruningRootDeflectors AS "pruningRootDeflectors"',
        'unit_work.cabling AS "cabling"',
        'unit_work.propping AS "propping"',
        'unit_work.fastening AS "fastening"',
        'unit_work.permeableSurfaceIncreases AS "permeableSurfaceIncreases"',
        'unit_work.fertilizations AS "fertilizations"',
        'unit_work.descompression AS "descompression"',
        'unit_work.drains AS "drains"',
        'unit_work.extractions AS "extractions"',
        'unit_work.plantations AS "plantations"',
        'unit_work.openingsPot AS "openingsPot"',
        'unit_work.advancedInspections AS "advancedInspections"',
        'unit_work.campaignDescription AS "campaignDescription"',
      ])
      .getRawOne();

    if (!campaign) {
      return null;
    }

    const campaignDto: ReadCampaignDto = {
      idUnitWork: campaign.idUnitWork,
      cabling: campaign.cabling,
      fastening: campaign.fastening,
      propping: campaign.propping,
      permeableSurfaceIncreases: campaign.permeableSurfaceIncreases,
      moveTarget: campaign.moveTarget,
      restrictAccess: campaign.restrictAccess,
      fertilizations: campaign.fertilizations,
      descompression: campaign.descompression,
      drains: campaign.drains,
      extractions: campaign.extractions,
      plantations: campaign.plantations,
      openingsPot: campaign.openingsPot,
      advancedInspections: campaign.advancedInspections,
      campaignDescription: campaign.campaignDescription,
      pruningTraining: campaign.pruningTraining,
      pruningSanitary: campaign.pruningSanitary,
      pruningHeightReduction: campaign.pruningHeightReduction,
      pruningBranchThinning: campaign.pruningBranchThinning,
      pruningSignClearing: campaign.pruningSignClearing,
      pruningPowerLineClearing: campaign.pruningPowerLineClearing,
      pruningRootDeflectors: campaign.pruningRootDeflectors,
    };
    return campaignDto;
  }

  async removeCampaignById(idCampaign: number) {
    const campaign = this.unitWorkRepository.findOne({ where: { idUnitWork: idCampaign } });
    if (!campaign) {
      return null;
    }
    return this.unitWorkRepository.delete(idCampaign);
  }

  async getTreesQtyPopulationInNeighborhoodUW(idUnitWork: number, idProject: number) {
    const result = await this.unitWorkRepository
      .createQueryBuilder('unit_work')
      .where('unit_work.idUnitWork = :idUnitWork', { idUnitWork })
      .andWhere('unit_work.unitWork_2 is null')
      .select(['unit_work.neighborhoodId AS "idNeighborhood"'])
      .getRawOne();

    return this.getTreesQtyPopulationInNeighborhood(result.idNeighborhood, idProject);
  }

  // Obtain the total quantity of trees in the neighborhood (or unit_work)
  async getTreesQtyPopulationInNeighborhood(idNeighborhood: number, idProject: number) {
    const meanOfTreesInBlockByNeighborhood = await this.treeService.getMeanTreesInBlock(idProject, idNeighborhood);

    const numBlocksInNeighborhood = await this.treeService.getNumBlocksInNeighborhood(idProject, idNeighborhood);
    if (numBlocksInNeighborhood === null) {
      throw new Error(`No se encontraron datos para idNeighborhood: ${idNeighborhood}, idProject: ${idProject}`);
    }

    if (!numBlocksInNeighborhood) {
      throw new Error(`El campo 'numBlocksInNeighborhood' es null o no existe en la base de datos`);
    }

    const neighborhoodPopulation = numBlocksInNeighborhood * meanOfTreesInBlockByNeighborhood;

    return Math.round(neighborhoodPopulation);
  }

  async calculateStandardDeviation(idProject: number, idUnitWork: number) {
    const result = await this.unitWorkRepository
      .createQueryBuilder('unit_work')
      .where('unit_work.idUnitWork = :idUnitWork', { idUnitWork })
      .andWhere('unit_work.unitWork_2 is null')
      .select(['unit_work.neighborhoodId AS "neighborhoodId"'])
      .getRawOne();

    if (!result || typeof result.neighborhoodId !== 'number') {
      throw new Error(`No se encontró un barrio asociado a la unidad de trabajo con ID ${idUnitWork}`);
    }

    const neighborhoodId = result.neighborhoodId;

    const stDevOfSample = await this.calculateStandardDeviationOfSample(idProject, neighborhoodId);
    const treeQtyOfSample = await this.treeService.countTreesInNeighborhood(idProject, neighborhoodId);
    const treeQtyOfPopulation = await this.getTreesQtyPopulationInNeighborhood(neighborhoodId, idProject);

    return (stDevOfSample * Math.sqrt(treeQtyOfSample / treeQtyOfPopulation)).toFixed(2);
  }

  async getMeanOfTreesInBlock(idProject: number, idUnitWork: number) {
    const result = await this.unitWorkRepository
      .createQueryBuilder('unit_work')
      .where('unit_work.idUnitWork = :idUnitWork', { idUnitWork })
      .andWhere('unit_work.unitWork_2 is null')
      .select(['unit_work.neighborhoodId AS "neighborhoodId"'])
      .getRawOne();

    const mean = await this.treeService.getMeanTreesInBlock(idProject, result.neighborhoodId);
    const meanOfTreesInBlocks = mean ? Number(mean).toFixed(2) : '0.00';

    return meanOfTreesInBlocks;
  }

  async calculateStandardDeviationOfSample(idProject: number, idNeighborhood: number) {
    const obtainMeanOfTreesInTheBlock = await this.treeService.getMeanTreesInBlock(idProject, idNeighborhood);

    if (!obtainMeanOfTreesInTheBlock) {
      return 0;
    }
    const TreeListInTheBlock = await this.treeService.getTreesInTheBlockList(idProject, idNeighborhood);

    if (TreeListInTheBlock.length === 0) {
      throw new Error('No hay datos suficientes para calcular la desviación estándar');
    }

    let sum = 0;
    TreeListInTheBlock.forEach((tree) => {
      let aux = tree.treesInTheBlock - obtainMeanOfTreesInTheBlock;
      aux = aux * aux;
      sum += aux;
    });

    let variance = sum / TreeListInTheBlock.length;
    return Math.sqrt(variance);
  }

  async applyFilters(idProject: number, idUnitWork: number, readFilterDto: ReadFilterDto) {
    return readFilterDto;
  }

  async findAllTreesByUnitWork(idProject: number, idUnitWork: number) {
    const trees = await this.unitWorkRepository
      .createQueryBuilder('unit_work')
      .innerJoinAndSelect('unit_work.project', 'project')
      .innerJoinAndSelect('project.tree', 'tree')
      .innerJoinAndSelect('tree.neighborhood', 'neighborhood')
      .where('unit_work.idUnitWork = :idUnitWork', { idUnitWork })
      .andWhere('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.id_neighborhood = unit_work.neighborhoodId')
      .andWhere('unit_work.unitWork_2 is null')
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

  async getCoordinatesOfNeighborhood(idNeighborhood: number) {
    const coordinatesOfNeighborhood = await this.coordinatesRepository
      .createQueryBuilder('coordinates')
      .leftJoin('trees', 'trees', 'trees.coordinate_id = coordinates.id_coordinate AND trees.neighborhood_id = :idNeighborhood', {
        idNeighborhood,
      })
      .where('coordinates.neighborhood_id = :idNeighborhood', { idNeighborhood })
      .andWhere('trees.id_tree IS NULL')
      .select(['coordinates.id_coordinate AS "idCoordinate"', 'coordinates.latitude AS "latitude"', 'coordinates.longitude AS "longitude"'])
      .orderBy('coordinates.id_coordinate', 'ASC')
      .getRawMany();

    return coordinatesOfNeighborhood;
  }

  async removeUnitWorksByProjectId(idProject: number): Promise<void> {
    await this.unitWorkRepository.delete({ projectId: idProject });
  }

  async getNeighborhoodDataByProject(idProject: number) {
    const [rows, speciesCounts, riskCounts] = await Promise.all([
      this.unitWorkRepository
        .createQueryBuilder('uw')
        .innerJoin('uw.neighborhood', 'neighborhood')
        .leftJoin('neighborhood.coordinates', 'coordinates')
        .where('uw.projectId = :idProject', { idProject })
        .andWhere('uw.unitWork_2 is null')
        .select([
          'uw.idUnitWork AS "idUnitWork"',
          'neighborhood.idNeighborhood AS "idNeighborhood"',
          'neighborhood.neighborhoodName AS "neighborhoodName"',
          'coordinates.idCoordinate AS "idCoordinate"',
          'coordinates.latitude AS "latitude"',
          'coordinates.longitude AS "longitude"',
        ])
        .orderBy('neighborhood.idNeighborhood', 'ASC')
        .addOrderBy('coordinates.idCoordinate', 'ASC')
        .getRawMany(),
      this.treeService.getSpeciesCountsPerNeighborhood(idProject),
      this.treeService.getRiskCountsPerNeighborhood(idProject),
    ]);

    const neighborhoodMap = new Map<
      number,
      {
        idUnitWork: number;
        idNeighborhood: number;
        neighborhoodName: string;
        coordinates: { latitude: number; longitude: number }[];
        additionalInfo: {
          totalTreesCount: number;
          predominantSpecies: string | null;
          predominantRisk: number | null;
          simpsonIndex: number;
        };
      }
    >();

    for (const row of rows) {
      if (!neighborhoodMap.has(row.idNeighborhood)) {
        neighborhoodMap.set(row.idNeighborhood, {
          idUnitWork: row.idUnitWork,
          idNeighborhood: row.idNeighborhood,
          neighborhoodName: row.neighborhoodName,
          coordinates: [],
          additionalInfo: { totalTreesCount: 0, predominantSpecies: null, predominantRisk: null, simpsonIndex: 0 },
        });
      }
      if (row.idCoordinate !== null) {
        neighborhoodMap.get(row.idNeighborhood).coordinates.push({ latitude: row.latitude, longitude: row.longitude });
      }
    }

    for (const [idNeighborhood, entry] of neighborhoodMap) {
      const speciesForNeighborhood = speciesCounts.filter((s) => s.neighborhoodId == idNeighborhood);
      const riskForNeighborhood = riskCounts.filter((r) => r.neighborhoodId == idNeighborhood);

      const totalTreesCount = speciesForNeighborhood.reduce((sum, s) => sum + s.count, 0);
      const predominantSpecies = speciesForNeighborhood.length > 0 ? speciesForNeighborhood[0].species : null;
      const predominantRisk = riskForNeighborhood.length > 0 ? riskForNeighborhood[0].risk : null;

      let simpsonIndex = 0;
      if (totalTreesCount > 1) {
        const sumNiNi1 = speciesForNeighborhood.reduce((sum, s) => sum + s.count * (s.count - 1), 0);
        simpsonIndex = parseFloat((1 - sumNiNi1 / (totalTreesCount * (totalTreesCount - 1))).toFixed(4));
      }

      entry.additionalInfo = { totalTreesCount, predominantSpecies, predominantRisk, simpsonIndex };
    }

    return Array.from(neighborhoodMap.values());
  }
}
