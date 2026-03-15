import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { UnitWork } from './entities/UnitWork';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadUnitWorkDto } from './dto/read-unitwork.dto';

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

  async generateUnitWorksToProject(idProject: number) {
    const neighborhoods = await this.treeService.getNeighborhoodsByProject(idProject);

    for (const neighborhood of neighborhoods) {
      const { idNeighborhood, numBlocksInNeighborhood } = neighborhood;

      const findUnitWork = await this.unitWorkRepository.findOneBy({
        projectId: idProject,
        neighborhoodId: idNeighborhood,
      });

      if (findUnitWork) {
        continue;
      }

      const treesInNeighborhood = await this.treeService.countTreesInNeighborhood(idProject, idNeighborhood);
      if (!treesInNeighborhood) {
        throw new Error(`No trees found for neighborhood ID: ${idNeighborhood}`);
      }

      // avg(treesInTheBlock) * numBlocksInNeighborhood = estimated total trees in neighborhood
      const averageTreesInBlock = await this.treeService.getMeanTreesInBlock(idProject, idNeighborhood);
      console.log(' averageTreesInBlock:', averageTreesInBlock);
      const estimatedTotalTreesInNeighborhood = Math.round(averageTreesInBlock * numBlocksInNeighborhood);
      console.log(' estimatedTotalTreesInNeighborhood:', estimatedTotalTreesInNeighborhood);

      const scale = (count: number) => {
        const result = Math.round((count / treesInNeighborhood) * estimatedTotalTreesInNeighborhood);
        console.log(`scale(${count}) => (${count}/${treesInNeighborhood}) * ${estimatedTotalTreesInNeighborhood} = ${result}`);
        return result;
      };
      const count = async (intervention: string) => {
        const result = await this.countInterventionInUnitWork(idProject, idNeighborhood, intervention);
        console.log(`count("${intervention}") => ${result}`);
        return result;
      };

      const newUnitWork = this.unitWorkRepository.create({
        projectId: idProject,
        neighborhoodId: idNeighborhood,
        pruningTraining: scale(await count('poda (formacion)')),
        pruningSanitary: scale(await count('poda (sanitaria)')),
        pruningHeightReduction: scale(await count('poda (reduccion de altura)')),
        pruningBranchThinning: scale(await count('poda (raleo de ramas)')),
        pruningSignClearing: scale(await count('poda (despeje de señaletica)')),
        pruningPowerLineClearing: scale(await count('poda (despeje de conductores electricos)')),
        pruningRootDeflectors: scale(await count('poda (radicular + uso de deflectores)')),
        restrictAccess: scale(await count('restringir acceso')),
        moveTarget: scale(await count('mover el blanco')),
        cabling: scale(await count('cableado')),
        fastening: scale(await count('sujecion')),
        propping: scale(await count('apuntalamiento')),
        permeableSurfaceIncreases: scale(await count('aumentar superficie permeable')),
        fertilizations: scale(await count('fertilizacion')),
        descompression: scale(await count('descompactado')),
        drains: scale(await count('drenaje')),
        extractions: scale(await count('extraccion del arbol')),
        plantations: scale(await count('plantacion de arbol faltante')),
        openingsPot: scale(await count('abertura de cazuela en vereda')),
        advancedInspections: scale(await count('requiere inspeccion avanzada')),
        campaignDescription: null,
      });

      await this.unitWorkRepository.save(newUnitWork);
    }

    return true;
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
      projectId: unitwork.projectId,
      neighborhoodId: unitwork.neighborhoodId,
      campaignDescription: campaignDescription.campaignDescription,
      unitWork_2: unitwork,
    });
    return this.unitWorkRepository.save(newCampaign);
  }

  async updateCampaignById(idCampaign: number, updateCampaignDto: UpdateCampaignDto) {
    // const campaign = await this.unitWorkRepository.findOne({
    //   where: { idUnitWork: idCampaign },
    // });

    const campaign = await this.unitWorkRepository
      .createQueryBuilder('unit_work')
      .where('unit_work.idUnitWork = :idCampaign', { idCampaign })
      .select([
        'unit_work.unitWork_2.idUnitWork AS "idUnitWorkUW"',
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

    const idUnitWork = campaign.idUnitWorkUW;

    const unitWork = await this.unitWorkRepository
      .createQueryBuilder('unit_work')
      .innerJoinAndSelect('unit_work.neighborhood', 'neighborhood')
      .where('unit_work.idUnitWork = :idUnitWork', { idUnitWork })
      .select([
        'unit_work.pruning_training AS "pruningTrainingUW"',
        'unit_work.pruning_sanitary AS "pruningSanitaryUW"',
        'unit_work.pruning_height_reduction AS "pruningHeightReductionUW"',
        'unit_work.pruning_branch_thinning AS "pruningBranchThinningUW"',
        'unit_work.pruning_sign_clearing AS "pruningSignClearingUW"',
        'unit_work.pruning_power_line_clearing AS "pruningPowerLineClearingUW"',
        'unit_work.pruning_root_deflectors AS "pruningRootDeflectorsUW"',
        'unit_work.cabling AS "cablingUW"',
        'unit_work.fastening AS "fasteningUW"',
        'unit_work.propping AS "proppingUW"',
        'unit_work.permeableSurfaceIncreases AS "permeableSurfaceIncreasesUW"',
        'unit_work.restrictAccess AS "restrictAccessUW"',
        'unit_work.moveTarget AS "moveTargetUW"',
        'unit_work.fertilizations AS "fertilizationsUW"',
        'unit_work.descompression AS "descompressionUW"',
        'unit_work.drains AS "drainsUW"',
        'unit_work.extractions AS "extractionsUW"',
        'unit_work.plantations AS "plantationsUW"',
        'unit_work.openingsPot AS "openingsPotUW"',
        'unit_work.advancedInspections AS "advancedInspectionsUW"',
        'unit_work.campaignDescription AS "campaignDescriptionUW"',
      ])
      .getRawOne();

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

    // Returns current + increment if increment is provided and doesn't exceed the UW limit; otherwise keeps current
    const clampedAdd = (current: number, increment: number | undefined, limit: number): number => {
      if (!increment) return current;
      return current + increment <= limit ? (current || 0) + increment : current;
    };

    const partialUpdate = {
      ...(campaignDescription && { campaignDescription }),
      pruningTraining: clampedAdd(campaign.pruningTraining, pruningTraining, unitWork.pruningTrainingUW),
      pruningSanitary: clampedAdd(campaign.pruningSanitary, pruningSanitary, unitWork.pruningSanitaryUW),
      pruningHeightReduction: clampedAdd(campaign.pruningHeightReduction, pruningHeightReduction, unitWork.pruningHeightReductionUW),
      pruningBranchThinning: clampedAdd(campaign.pruningBranchThinning, pruningBranchThinning, unitWork.pruningBranchThinningUW),
      pruningSignClearing: clampedAdd(campaign.pruningSignClearing, pruningSignClearing, unitWork.pruningSignClearingUW),
      pruningPowerLineClearing: clampedAdd(
        campaign.pruningPowerLineClearing,
        pruningPowerLineClearing,
        unitWork.pruningPowerLineClearingUW,
      ),
      pruningRootDeflectors: clampedAdd(campaign.pruningRootDeflectors, pruningRootDeflectors, unitWork.pruningRootDeflectorsUW),
      cabling: clampedAdd(campaign.cabling, cabling, unitWork.cablingUW),
      fastening: clampedAdd(campaign.fastening, fastening, unitWork.fasteningUW),
      propping: clampedAdd(campaign.propping, propping, unitWork.proppingUW),
      permeableSurfaceIncreases: clampedAdd(
        campaign.permeableSurfaceIncreases,
        permeableSurfaceIncreases,
        unitWork.permeableSurfaceIncreasesUW,
      ),
      moveTarget: clampedAdd(campaign.moveTarget, moveTarget, unitWork.moveTargetUW),
      restrictAccess: clampedAdd(campaign.restrictAccess, restrictAccess, unitWork.restrictAccessUW),
      fertilizations: clampedAdd(campaign.fertilizations, fertilizations, unitWork.fertilizationsUW),
      descompression: clampedAdd(campaign.descompression, descompression, unitWork.descompressionUW),
      drains: clampedAdd(campaign.drains, drains, unitWork.drainsUW),
      extractions: clampedAdd(campaign.extractions, extractions, unitWork.extractionsUW),
      plantations: clampedAdd(campaign.plantations, plantations, unitWork.plantationsUW),
      openingsPot: clampedAdd(campaign.openingsPot, openingsPot, unitWork.openingsPotUW),
      advancedInspections: clampedAdd(campaign.advancedInspections, advancedInspections, unitWork.advancedInspectionsUW),
    };

    const result = await this.unitWorkRepository.update(idCampaign, partialUpdate);

    if (result.affected === 0) {
      throw new NotFoundException('Invalid update');
    }

    return this.unitWorkRepository.findOne({ where: { idUnitWork: idCampaign } });
  }

  async getTreesByUnitWork(idUnitWork: number) {
    const treesOfUnitWork = await this.unitWorkRepository
      .createQueryBuilder('unit_work')
      .innerJoinAndSelect('unit_work.project', 'project')
      .innerJoinAndSelect('project.tree', 'tree')
      .innerJoinAndSelect('tree.neighborhood', 'neighborhood')
      .innerJoinAndSelect('tree.coordinate', 'coordinate')
      .where('unit_work.idUnitWork = :idUnitWork', { idUnitWork })
      .andWhere('neighborhood.idNeighborhood = unit_work.neighborhoodId')
      .andWhere('unit_work.unitWork_2 is null')
      .select([
        'tree.idTree AS "idTree"',
        'tree.address AS "address"',
        'tree.datetime AS "datetime"',
        'coordinate.longitude AS "longitude"',
        'coordinate.latitude AS "latitude"',
      ])
      .getRawMany();
    return treesOfUnitWork;
  }

  async findAllCampaignsByUnitWork(idUnitWork: number): Promise<ReadUnitWorkDto[]> {
    const unitWorks = await this.unitWorkRepository
      .createQueryBuilder('unit_work')
      .innerJoinAndSelect('unit_work.neighborhood', 'neighborhood')
      .where('unit_work.unitWork_2.idUnitWork = :idUnitWork', { idUnitWork })
      .andWhere('unit_work.unitWork_2 is not null')
      .select([
        'unit_work.idUnitWork AS "idUnitWork"',
        'unit_work.projectId AS "projectId"',
        'unit_work.neighborhoodId AS "neighborhoodId"',
        'neighborhood.neighborhoodName AS "neighborhoodName"',
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
      .orderBy('unit_work.idUnitWork', 'ASC') // Ordenar por idUnitWork de forma ascendente
      .getRawMany();

    return unitWorks.map((unitWork) => ({
      idUnitWork: unitWork.idUnitWork,
      projectId: unitWork.projectId,
      neighborhoodId: unitWork.neighborhoodId,
      neighborhoodName: unitWork.neighborhoodName,
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
    const unitWorkOld = await this.unitWorkRepository.findOne({
      where: { idUnitWork: idUnitWork },
      relations: ['neighborhood'],
    });

    let pruningTrainingSum = 0;
    let pruningSanitarySum = 0;
    let pruningHeightReductionSum = 0;
    let pruningBranchThinningSum = 0;
    let pruningSignClearingSum = 0;
    let pruningPowerLineClearingSum = 0;
    let pruningRootDeflectorsSum = 0;
    let cablingSum = 0;
    let fasteningSum = 0;
    let proppingSum = 0;
    let permeableSurfaceIncreasesSum = 0;
    let restrictAccessSum = 0;
    let moveTargetSum = 0;
    let fertilizationsSum = 0;
    let descompressionSum = 0;
    let drainsSum = 0;
    let extractionsSum = 0;
    let plantationsSum = 0;
    let openingsPotSum = 0;
    let advancedInspectionsSum = 0;

    // Sum all attributes of campaigns
    const campaigns = await this.findAllCampaignsByUnitWork(idUnitWork);

    campaigns.forEach((campaign) => {
      pruningTrainingSum += campaign.pruningTraining;
      pruningSanitarySum += campaign.pruningSanitary;
      pruningHeightReductionSum += campaign.pruningHeightReduction;
      pruningBranchThinningSum += campaign.pruningBranchThinning;
      pruningSignClearingSum += campaign.pruningSignClearing;
      pruningPowerLineClearingSum += campaign.pruningPowerLineClearing;
      pruningRootDeflectorsSum += campaign.pruningRootDeflectors;

      cablingSum += campaign.cabling;
      fasteningSum += campaign.fastening;
      proppingSum += campaign.propping;
      permeableSurfaceIncreasesSum += campaign.permeableSurfaceIncreases;
      restrictAccessSum += campaign.restrictAccess;
      moveTargetSum += campaign.moveTarget;
      fertilizationsSum += campaign.fertilizations;
      descompressionSum += campaign.descompression;
      drainsSum += campaign.drains;
      extractionsSum += campaign.extractions;
      plantationsSum += campaign.plantations;
      openingsPotSum += campaign.openingsPot;
      advancedInspectionsSum += campaign.advancedInspections;
    });

    pruningTrainingSum = Math.max(0, unitWorkOld.pruningTraining - pruningTrainingSum);
    pruningSanitarySum = Math.max(0, unitWorkOld.pruningSanitary - pruningSanitarySum);
    pruningHeightReductionSum = Math.max(0, unitWorkOld.pruningHeightReduction - pruningHeightReductionSum);
    pruningBranchThinningSum = Math.max(0, unitWorkOld.pruningBranchThinning - pruningBranchThinningSum);
    pruningSignClearingSum = Math.max(0, unitWorkOld.pruningSignClearing - pruningSignClearingSum);
    pruningPowerLineClearingSum = Math.max(0, unitWorkOld.pruningPowerLineClearing - pruningPowerLineClearingSum);
    pruningRootDeflectorsSum = Math.max(0, unitWorkOld.pruningRootDeflectors - pruningRootDeflectorsSum);
    cablingSum = Math.max(0, unitWorkOld.cabling - cablingSum);
    fasteningSum = Math.max(0, unitWorkOld.fastening - fasteningSum);
    proppingSum = Math.max(0, unitWorkOld.propping - proppingSum);
    permeableSurfaceIncreasesSum = Math.max(0, unitWorkOld.permeableSurfaceIncreases - permeableSurfaceIncreasesSum);
    restrictAccessSum = Math.max(0, unitWorkOld.restrictAccess - restrictAccessSum);
    moveTargetSum = Math.max(0, unitWorkOld.moveTarget - moveTargetSum);
    fertilizationsSum = Math.max(0, unitWorkOld.fertilizations - fertilizationsSum);
    descompressionSum = Math.max(0, unitWorkOld.descompression - descompressionSum);
    drainsSum = Math.max(0, unitWorkOld.drains - drainsSum);
    extractionsSum = Math.max(0, unitWorkOld.extractions - extractionsSum);
    plantationsSum = Math.max(0, unitWorkOld.plantations - plantationsSum);
    openingsPotSum = Math.max(0, unitWorkOld.openingsPot - openingsPotSum);
    advancedInspectionsSum = Math.max(0, unitWorkOld.advancedInspections - advancedInspectionsSum);

    const updateDto: ReadUnitWorkDto = {
      idUnitWork: unitWorkOld.idUnitWork,
      projectId: unitWorkOld.projectId,
      neighborhoodId: unitWorkOld.neighborhoodId,
      neighborhoodName: unitWorkOld.neighborhood.neighborhoodName,
      pruningTraining: pruningTrainingSum,
      pruningSanitary: pruningSanitarySum,
      pruningHeightReduction: pruningHeightReductionSum,
      pruningBranchThinning: pruningBranchThinningSum,
      pruningSignClearing: pruningSignClearingSum,
      pruningPowerLineClearing: pruningPowerLineClearingSum,
      pruningRootDeflectors: pruningRootDeflectorsSum,
      cabling: cablingSum,
      fastening: fasteningSum,
      propping: proppingSum,
      permeableSurfaceIncreases: permeableSurfaceIncreasesSum,
      moveTarget: moveTargetSum,
      restrictAccess: restrictAccessSum,
      fertilizations: fertilizationsSum,
      descompression: descompressionSum,
      drains: drainsSum,
      extractions: extractionsSum,
      plantations: plantationsSum,
      openingsPot: openingsPotSum,
      advancedInspections: advancedInspectionsSum,
      campaignDescription: unitWorkOld.campaignDescription,
    };

    return updateDto;
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

  async getCampaignById(idCampaign: number): Promise<ReadUnitWorkDto> {
    const campaign = await this.unitWorkRepository
      .createQueryBuilder('unit_work')
      .innerJoinAndSelect('unit_work.neighborhood', 'neighborhood')
      .where('unit_work.idUnitWork = :idCampaign', { idCampaign })
      .andWhere('unit_work.unitWork_2 is not null')
      .select([
        'unit_work.idUnitWork AS "idUnitWork"',
        'unit_work.projectId AS "projectId"',
        'unit_work.neighborhoodId AS "neighborhoodId"',
        'neighborhood.neighborhoodName AS "neighborhoodName"',
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

    const campaignDto: ReadUnitWorkDto = {
      idUnitWork: campaign.idUnitWork,
      projectId: campaign.projectId,
      neighborhoodId: campaign.neighborhoodId,
      neighborhoodName: campaign.neighborhoodName,
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

  // Obtain intervention info by project and neighborhood

  private async countInterventionInUnitWork(idProject: number, idNeighborhood: number, interventionName: string): Promise<number> {
    return this.treeService.countTreesByIntervention(idProject, idNeighborhood, interventionName);
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
