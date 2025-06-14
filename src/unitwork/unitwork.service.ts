import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { UnitWork } from './entities/UnitWork';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trees } from '../tree/entities/Trees';
import { ReadUnitWorkDto } from './dto/read-unitwork.dto';
import { PopulationDataDto } from './dto/population-data.dto';
import { SampleDataDto } from './dto/sample-data.dto';
import { ReadFilterDto } from '../project/dto/read-filter.dto';
import { Coordinates } from '../shared/entities/Coordinates';
@Injectable()
export class UnitWorkService {
  private oldUpdateDto: ReadUnitWorkDto;
  private sampleDataDto: SampleDataDto;
  private populationDataDto: PopulationDataDto;
  constructor(
    @InjectRepository(UnitWork) private readonly unitWorkRepository: Repository<UnitWork>,
    @InjectRepository(Trees) private readonly treeRepository: Repository<Trees>,
    @InjectRepository(Coordinates) private readonly coordinatesRepository: Repository<Coordinates>,
  ) {
    this.oldUpdateDto = {
      idUnitWork: 0,
      projectId: 0,
      neighborhoodId: 0,
      neighborhoodName: '',
      pruningTraining: 0,
      pruningSanitary: 0,
      pruningHeightReduction: 0,
      pruningBranchThinning: 0,
      pruningSignClearing: 0,
      pruningPowerLineClearing: 0,
      pruningRootDeflectors: 0,
      cabling: 0,
      fastening: 0,
      propping: 0,
      permeableSurfaceIncreases: 0,
      moveTarget: 0,
      restrictAccess: 0,
      fertilizations: 0,
      descompression: 0,
      drains: 0,
      extractions: 0,
      plantations: 0,
      openingsPot: 0,
      advancedInspections: 0,
      campaignDescription: '',
    };

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
      .where('unit_work.project.idProject = :idProject', { idProject })
      .andWhere('unit_work.unitWork_2 is null')
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
    const neighborhoodIds = await this.findNeighborhoodsIdsOfTreesInProjectId(idProject);

    neighborhoodIds.forEach(async (neighborhood) => {
      const findUnitWork = await this.unitWorkRepository.findOneBy({
        projectId: idProject,
        neighborhoodId: neighborhood.neighborhoodId,
      });

      if (findUnitWork) {
        // Existe el registro con estos valores de projectId y neighborhoodId
        return null;
      }

      // Crea una nueva instancia de UnitWork con los valores iniciales necesarios
      const newUnitWork = this.unitWorkRepository.create({
        projectId: idProject,
        neighborhoodId: neighborhood.neighborhoodId,
        pruningTraining: await this.obtainPruningTrainingQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        pruningSanitary: await this.obtainPruningSanitaryQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        pruningHeightReduction: await this.obtainPruningHeightReductionQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        pruningBranchThinning: await this.obtainPruningBranchThinningQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        pruningSignClearing: await this.obtainPruningSignClearingQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        pruningPowerLineClearing: await this.obtainPruningPowerLineClearingQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        pruningRootDeflectors: await this.obtainPruningRootDeflectorsQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        restrictAccess: await this.obtainrestrictAccessQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        moveTarget: await this.obtainmoveTargetQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        cabling: await this.obtainCablingQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        fastening: await this.obtainFasteningQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        propping: await this.obtainProppingQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        permeableSurfaceIncreases: await this.obtainPermeableSurfaceIncreasesQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        fertilizations: await this.obtainFertilizationsQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        descompression: await this.obtainDescompressionQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        drains: await this.obtainDrainsQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        extractions: await this.obtainExtractionsQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        plantations: await this.obtainPlantationsQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        openingsPot: await this.obtainOpeningsPotQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        advancedInspections: await this.obtainAdvancedInspectionsQtyInUnitWork(idProject, neighborhood.neighborhoodId),
        campaignDescription: null,
      });

      const populationTreesQty = await this.getTreesQtyPopulationInNeighborhood(neighborhood.neighborhoodId, idProject);

      const treeQtyOfSample = await this.obtainTreeQtyInTheBlock(neighborhood.neighborhoodId, idProject);

      if (!treeQtyOfSample) {
        throw new Error(`Tree quantity not found for UnitWork ID: ${findUnitWork.idUnitWork}`);
      }

      newUnitWork.pruningTraining = Math.round((newUnitWork.pruningTraining / treeQtyOfSample) * populationTreesQty);
      newUnitWork.pruningSanitary = Math.round((newUnitWork.pruningSanitary / treeQtyOfSample) * populationTreesQty);
      newUnitWork.pruningHeightReduction = Math.round((newUnitWork.pruningHeightReduction / treeQtyOfSample) * populationTreesQty);
      newUnitWork.pruningBranchThinning = Math.round((newUnitWork.pruningBranchThinning / treeQtyOfSample) * populationTreesQty);
      newUnitWork.pruningSignClearing = Math.round((newUnitWork.pruningSignClearing / treeQtyOfSample) * populationTreesQty);
      newUnitWork.pruningPowerLineClearing = Math.round((newUnitWork.pruningPowerLineClearing / treeQtyOfSample) * populationTreesQty);
      newUnitWork.pruningRootDeflectors = Math.round((newUnitWork.pruningRootDeflectors / treeQtyOfSample) * populationTreesQty);

      newUnitWork.cabling = Math.round((newUnitWork.cabling / treeQtyOfSample) * populationTreesQty);
      newUnitWork.fastening = Math.round((newUnitWork.fastening / treeQtyOfSample) * populationTreesQty);
      newUnitWork.propping = Math.round((newUnitWork.propping / treeQtyOfSample) * populationTreesQty);
      newUnitWork.permeableSurfaceIncreases = Math.round((newUnitWork.permeableSurfaceIncreases / treeQtyOfSample) * populationTreesQty);
      newUnitWork.moveTarget = Math.round((newUnitWork.moveTarget / treeQtyOfSample) * populationTreesQty);
      newUnitWork.restrictAccess = Math.round((newUnitWork.restrictAccess / treeQtyOfSample) * populationTreesQty);
      newUnitWork.fertilizations = Math.round((newUnitWork.fertilizations / treeQtyOfSample) * populationTreesQty);
      newUnitWork.descompression = Math.round((newUnitWork.descompression / treeQtyOfSample) * populationTreesQty);
      newUnitWork.drains = Math.round((newUnitWork.drains / treeQtyOfSample) * populationTreesQty);
      newUnitWork.extractions = Math.round((newUnitWork.extractions / treeQtyOfSample) * populationTreesQty);
      newUnitWork.plantations = Math.round((newUnitWork.plantations / treeQtyOfSample) * populationTreesQty);
      newUnitWork.openingsPot = Math.round((newUnitWork.openingsPot / treeQtyOfSample) * populationTreesQty);
      newUnitWork.advancedInspections = Math.round((newUnitWork.advancedInspections / treeQtyOfSample) * populationTreesQty);

      const unitWork = await this.unitWorkRepository.save(newUnitWork);
    });

    return true;
  }

  async findNeighborhoodsIdsOfTreesInProjectId(idProject: number) {
    const neighborhoods = await this.treeRepository
      .createQueryBuilder('trees')
      .innerJoinAndSelect('trees.project', 'project')
      .where('project.idProject = :idProject', { idProject })
      .select(['trees.neighborhood AS "neighborhoodId"'])
      .groupBy('trees.neighborhood')
      .getRawMany();

    return neighborhoods;
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
      cabling: 0,
      fastening: 0,
      propping: 0,
      permeableSurfaceIncreases: 0,
      fertilizations: 0,
      descompression: 0,
      drains: 0,
      extractions: 0,
      plantations: 0,
      openingsPot: 0,
      advancedInspections: 0,
      pruningTraining: 0,
      pruningSanitary: 0,
      pruningHeightReduction: 0,
      pruningBranchThinning: 0,
      pruningSignClearing: 0,
      pruningPowerLineClearing: 0,
      pruningRootDeflectors: 0,
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
      projectName,
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

    // Verifying each value of the new sum is not greather than unitWork's values
    const partialUpdate = {
      ...(campaignDescription && { campaignDescription }),
      pruningTraining:
        pruningTraining && campaign.pruningTraining + pruningTraining <= unitWork.pruningTrainingUW
          ? (campaign.pruningTraining || 0) + pruningTraining
          : campaign.pruningTraining,
      pruningSanitary:
        pruningSanitary && campaign.pruningSanitary + pruningSanitary <= unitWork.pruningSanitaryUW
          ? (campaign.pruningSanitary || 0) + pruningSanitary
          : campaign.pruningSanitary,
      pruningHeightReduction:
        pruningHeightReduction && campaign.pruningHeightReduction + pruningHeightReduction <= unitWork.pruningHeightReductionUW
          ? (campaign.pruningHeightReduction || 0) + pruningHeightReduction
          : campaign.pruningHeightReduction,
      pruningBranchThinning:
        pruningBranchThinning && campaign.pruningBranchThinning + pruningBranchThinning <= unitWork.pruningBranchThinningUW
          ? (campaign.pruningBranchThinning || 0) + pruningBranchThinning
          : campaign.pruningBranchThinning,
      pruningSignClearing:
        pruningSignClearing && campaign.pruningSignClearing + pruningSignClearing <= unitWork.pruningSignClearingUW
          ? (campaign.pruningSignClearing || 0) + pruningSignClearing
          : campaign.pruningSignClearing,
      pruningPowerLineClearing:
        pruningPowerLineClearing && campaign.pruningPowerLineClearing + pruningPowerLineClearing <= unitWork.pruningPowerLineClearingUW
          ? (campaign.pruningPowerLineClearing || 0) + pruningPowerLineClearing
          : campaign.pruningPowerLineClearing,
      pruningRootDeflectors:
        pruningRootDeflectors && campaign.pruningRootDeflectors + pruningRootDeflectors <= unitWork.pruningRootDeflectorsUW
          ? (campaign.pruningRootDeflectors || 0) + pruningRootDeflectors
          : campaign.pruningRootDeflectors,
      cabling: cabling && campaign.cabling + cabling <= unitWork.cablingUW ? (campaign.cabling || 0) + cabling : campaign.cabling,
      fastening:
        fastening && campaign.fastening + fastening <= unitWork.fasteningUW ? (campaign.fastening || 0) + fastening : campaign.fastening,
      propping: propping && campaign.propping + propping <= unitWork.proppingUW ? (campaign.propping || 0) + propping : campaign.propping,
      permeableSurfaceIncreases:
        permeableSurfaceIncreases && campaign.permeableSurfaceIncreases + permeableSurfaceIncreases <= unitWork.permeableSurfaceIncreasesUW
          ? (campaign.permeableSurfaceIncreases || 0) + permeableSurfaceIncreases
          : campaign.permeableSurfaceIncreases,
      moveTarget:
        moveTarget && campaign.moveTarget + moveTarget <= unitWork.moveTargetUW
          ? (campaign.moveTarget || 0) + moveTarget
          : campaign.moveTarget,
      restrictAccess:
        restrictAccess && campaign.restrictAccess + restrictAccess <= unitWork.restrictAccessUW
          ? (campaign.restrictAccess || 0) + restrictAccess
          : campaign.restrictAccess,
      fertilizations:
        fertilizations && campaign.fertilizations + fertilizations <= unitWork.fertilizationsUW
          ? (campaign.fertilizations || 0) + fertilizations
          : campaign.fertilizations,
      descompression:
        descompression && campaign.descompression + descompression <= unitWork.descompressionUW
          ? (campaign.descompression || 0) + descompression
          : campaign.descompression,
      drains: drains && campaign.drains + drains <= unitWork.drainsUW ? (campaign.drains || 0) + drains : campaign.drains,
      extractions:
        extractions && campaign.extractions + extractions <= unitWork.extractionsUW
          ? (campaign.extractions || 0) + extractions
          : campaign.extractions,
      plantations:
        plantations && campaign.plantations + plantations <= unitWork.plantationsUW
          ? (campaign.plantations || 0) + plantations
          : campaign.plantations,
      openingsPot:
        openingsPot && campaign.openingsPot + openingsPot <= unitWork.openingsPotUW
          ? (campaign.openingsPot || 0) + openingsPot
          : campaign.openingsPot,
      advancedInspections:
        advancedInspections && campaign.advancedInspections + advancedInspections <= unitWork.advancedInspectionsUW
          ? (campaign.advancedInspections || 0) + advancedInspections
          : campaign.advancedInspections,
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

    var pruningTrainingSum = 0;
    var pruningSanitarySum = 0;
    var pruningHeightReductionSum = 0;
    var pruningBranchThinningSum = 0;
    var pruningSignClearingSum = 0;
    var pruningPowerLineClearingSum = 0;
    var pruningRootDeflectorsSum = 0;
    var cablingSum = 0;
    var fasteningSum = 0;
    var proppingSum = 0;
    var permeableSurfaceIncreasesSum = 0;
    var restrictAccessSum = 0;
    var moveTargetSum = 0;
    var fertilizationsSum = 0;
    var descompressionSum = 0;
    var drainsSum = 0;
    var extractionsSum = 0;
    var plantationsSum = 0;
    var openingsPotSum = 0;
    var advancedInspectionsSum = 0;

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

  async obtainPruningTrainingQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const pruningTrainingQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Poda (Formación)' })
      .select('COUNT(*)', 'pruning_training')
      .getRawOne();

    return parseInt(pruningTrainingQty?.pruning_training || '0', 10);
  }

  async obtainPruningSanitaryQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const pruningSanitaryQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Poda (Sanitaria)' })
      .select('COUNT(*)', 'pruning_sanitary')
      .getRawOne();

    return parseInt(pruningSanitaryQty?.pruning_sanitary || '0', 10);
  }

  async obtainPruningHeightReductionQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const pruningHeightReductionQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Poda (Reducción de altura)' })
      .select('COUNT(*)', 'pruning_height_reduction')
      .getRawOne();

    return parseInt(pruningHeightReductionQty?.pruning_height_reduction || '0', 10);
  }

  async obtainPruningBranchThinningQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const pruningBranchThinningQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Poda (Raleo de ramas)' })
      .select('COUNT(*)', 'pruning_branch_thinning')
      .getRawOne();

    return parseInt(pruningBranchThinningQty?.pruning_branch_thinning || '0', 10);
  }

  async obtainPruningSignClearingQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const pruningSignClearingQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Poda (Despeje de señalética)' })
      .select('COUNT(*)', 'pruning_sign_clearing')
      .getRawOne();

    return parseInt(pruningSignClearingQty?.pruning_sign_clearing || '0', 10);
  }

  async obtainPruningPowerLineClearingQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const pruningPowerLineClearingQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', {
        interventionName: 'Poda (Despeje de conductores eléctricos)',
      })
      .select('COUNT(*)', 'pruning_power_line_clearing')
      .getRawOne();

    return parseInt(pruningPowerLineClearingQty?.pruning_power_line_clearing || '0', 10);
  }

  async obtainPruningRootDeflectorsQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const pruningRootDeflectorsQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', {
        interventionName: 'Poda (Radicular + uso de deflectores)',
      })
      .select('COUNT(*)', 'pruning_root_deflectors')
      .getRawOne();

    return parseInt(pruningRootDeflectorsQty?.pruning_root_deflectors || '0', 10);
  }

  async obtainCablingQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const cablingQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Cableado' })
      .select('COUNT(*)', 'cabling')
      .getRawOne();

    return parseInt(cablingQty?.cabling || '0', 10);
  }

  async obtainFasteningQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const fasteningQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Sujeción' })
      .select('COUNT(*)', 'fastening')
      .getRawOne();

    return parseInt(fasteningQty?.fastening || '0', 10);
  }

  async obtainProppingQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const proppingQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Apuntalamiento' })
      .select('COUNT(*)', 'propping')
      .getRawOne();

    return parseInt(proppingQty?.propping || '0', 10);
  }

  async obtainmoveTargetQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const moveTargetQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Mover el blanco' })
      .select('COUNT(*)', 'moveTarget')
      .getRawOne();

    return parseInt(moveTargetQty?.moveTarget || '0', 10);
  }

  async obtainrestrictAccessQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const restrictAccessQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Restringir acceso' })
      .select('COUNT(*)', 'restrictAccess')
      .getRawOne();

    return parseInt(restrictAccessQty?.restrictAccess || '0', 10);
  }

  async obtainPermeableSurfaceIncreasesQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const permeableSurfaceIncreasesQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Aumentar superficie permeable' })
      .select('COUNT(*)', 'permeableSurfaceIncreases')
      .getRawOne();

    return parseInt(permeableSurfaceIncreasesQty?.permeableSurfaceIncreases || '0', 10);
  }

  async obtainFertilizationsQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const fertilizationsQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Fertilización' })
      .select('COUNT(*)', 'fertilizations')
      .getRawOne();

    return parseInt(fertilizationsQty?.fertilizations || '0', 10);
  }

  async obtainDescompressionQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const descompressionQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Descompactado' })
      .select('COUNT(*)', 'descompression')
      .getRawOne();

    return parseInt(descompressionQty?.descompression || '0', 10);
  }

  async obtainDrainsQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const drainsQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Drenaje' })
      .select('COUNT(*)', 'drains')
      .getRawOne();

    return parseInt(drainsQty?.drains || '0', 10);
  }

  async obtainExtractionsQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const extractionsQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Extraccion del árbol' })
      .select('COUNT(*)', 'extractions')
      .getRawOne();

    return parseInt(extractionsQty?.extractions || '0', 10);
  }

  async obtainPlantationsQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const plantationsQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Plantación de arbol faltante' })
      .select('COUNT(*)', 'plantations')
      .getRawOne();

    return parseInt(plantationsQty?.plantations || '0', 10);
  }

  async obtainOpeningsPotQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const openingsPotQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'Abertura de cazuela en vereda' })
      .select('COUNT(*)', 'openingsPot')
      .getRawOne();

    return parseInt(openingsPotQty?.openingsPot || '0', 10);
  }

  async obtainAdvancedInspectionsQtyInUnitWork(idProject: number, idNeighborhood: number): Promise<number> {
    const advancedInspectionsQty = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('intervention.interventionName = :interventionName', { interventionName: 'REQUIERE INSPECCION AVANZADA' })
      .select('COUNT(*)', 'advancedInspections')
      .getRawOne();

    return parseInt(advancedInspectionsQty?.advancedInspections || '0', 10);
  }

  async numNlocksInNeighborhood(idNeighborhood: number, idProject: number) {
    const meanOfTreesInBlockByNeighborhood = await this.obtainMeanOfTreesInTheBlock(idNeighborhood, idProject);

    const result = await this.treeRepository
      .createQueryBuilder('trees')
      .innerJoin('trees.neighborhood', 'neighborhood')
      .innerJoin('trees.project', 'project')
      .andWhere('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .select('neighborhood.numBlocksInNeighborhood AS "numBlocksInNeighborhood"') // Asegurar el alias correcto
      .getRawOne();

    return result;
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
    const meanOfTreesInBlockByNeighborhood = await this.obtainMeanOfTreesInTheBlock(idNeighborhood, idProject);

    const result = await this.treeRepository
      .createQueryBuilder('trees')
      .innerJoin('trees.neighborhood', 'neighborhood')
      .innerJoin('trees.project', 'project')
      .andWhere('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .select('neighborhood.numBlocksInNeighborhood AS "numBlocksInNeighborhood"') // Asegurar el alias correcto
      .getRawOne();

    if (!result) {
      throw new Error(`No se encontraron datos para idNeighborhood: ${idNeighborhood}, idProject: ${idProject}`);
    }

    if (!result.numBlocksInNeighborhood) {
      throw new Error(`El campo 'numBlocksInNeighborhood' es null o no existe en la base de datos`);
    }

    const neighborhoodPopulation = result.numBlocksInNeighborhood * meanOfTreesInBlockByNeighborhood;

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
    const treeQtyOfSample = await this.obtainTreeQtyInTheBlock(neighborhoodId, idProject);
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

    const mean = await this.obtainMeanOfTreesInTheBlock(result.neighborhoodId, idProject);
    const meanOfTreesInBlocks = mean ? Number(mean).toFixed(2) : '0.00';

    return meanOfTreesInBlocks;
  }

  async calculateStandardDeviationOfSample(idProject: number, idNeighborhood: number) {
    const obtainMeanOfTreesInTheBlock = await this.obtainMeanOfTreesInTheBlock(idNeighborhood, idProject);

    if (!obtainMeanOfTreesInTheBlock) {
      return 0;
    }
    const TreeListInTheBlock = await this.treeRepository
      .createQueryBuilder('trees')
      .innerJoin('trees.project', 'project')
      .innerJoin('trees.neighborhood', 'neighborhood')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('trees.treesInTheBlock is not null')
      .select(['trees.treesInTheBlock AS "treesInTheBlock"'])
      .getRawMany();

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

  async obtainMeanOfTreesInTheBlock(idNeighborhood: number, idProject: number) {
    const meanOfTrees = await this.treeRepository
      .createQueryBuilder('trees')
      .innerJoin('trees.project', 'project')
      .innerJoin('trees.neighborhood', 'neighborhood')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .select(['AVG(trees.treesInTheBlock) AS "meanOfTreesInTheBlock"'])
      .getRawOne();
    return meanOfTrees.meanOfTreesInTheBlock;
  }

  // Obtain the quantity of trees in the sample associated to project and neighborhood
  async obtainTreeQtyInTheBlock(idNeighborhood: number, idProject: number): Promise<number> {
    const qtyOfSample = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .andWhere('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .select(['COUNT(*) AS "treesQty"'])
      .groupBy('tree.neighborhood')
      .getRawOne();

    return Math.round(qtyOfSample.treesQty);
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

  async getInfoOfNeighborhood(idProject: number, idUnitWork: number) {
    //cconst treeQty;
    //const predominantSpecies;
    //const predominantRisk;
    //const simpsonIndex;
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
}
