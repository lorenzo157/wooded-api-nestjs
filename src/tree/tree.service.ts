import { Injectable } from '@nestjs/common';
import { CreateTreeDto } from './dto/create-tree.dto';
import { DataSource, Repository } from 'typeorm';
import { Filter } from './dto/filter';
import { Trees } from './entities/Trees';
import { InjectRepository } from '@nestjs/typeorm';
import { Pests } from './entities/Pests';
import { ProjectService } from '../project/project.service';
import { Coordinates } from '../shared/entities/Coordinates';
import { PestTree } from './entities/PestTree';
import { InterventionTree } from './entities/InterventionTree';
import { Interventions } from './entities/Interventions';
import { DefectTree } from './entities/DefectTree';
import { Defects } from './entities/Defects';
import { ConflictTree } from './entities/ConflictTree';
import { Conflicts } from './entities/Conflicts';
import { Diseases } from './entities/Diseases';
import { DiseaseTree } from './entities/DiseaseTree';
import { SimplyReadTreeDto } from './dto/simply-read-tree.dto';
import { ReadTreeDto } from './dto/read-tree.dto';
import { S3Service } from '../utils/s3.service';
import { FileStorageFactory } from '../utils/file-storage.factory';
import { PATH_TREES_PHOTOS } from '../utils/constants';
@Injectable()
export class TreeService {
  constructor(
    @InjectRepository(Trees) private readonly treeRepository: Repository<Trees>,
    @InjectRepository(Coordinates) private readonly coordinatesRepository: Repository<Coordinates>,
    @InjectRepository(Conflicts) private readonly conflictRepository: Repository<Conflicts>,
    @InjectRepository(ConflictTree) private readonly conflictTreeRepository: Repository<ConflictTree>,
    @InjectRepository(Defects) private readonly defectRepository: Repository<Defects>,
    @InjectRepository(DefectTree) private readonly defectTreeRepository: Repository<DefectTree>,
    @InjectRepository(Diseases) private readonly diseaseRepository: Repository<Diseases>,
    @InjectRepository(DiseaseTree) private readonly diseaseTreeRepository: Repository<DiseaseTree>,
    @InjectRepository(Interventions) private readonly interventionRepository: Repository<Interventions>,
    @InjectRepository(InterventionTree) private readonly interventionTreeRepository: Repository<InterventionTree>,
    @InjectRepository(Pests) private readonly pestRepository: Repository<Pests>,
    @InjectRepository(PestTree) private readonly pestTreeRepository: Repository<PestTree>,
    private readonly projectService: ProjectService,
    private readonly s3Service: S3Service,
    private readonly fileStorageFactory: FileStorageFactory,
    private readonly dataSource: DataSource,
  ) {}

  async createTree(createTreeDto: CreateTreeDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const {
      conflictsNames,
      createDefectsDtos,
      diseasesNames,
      interventionsNames,
      pestsNames,
      latitude,
      longitude,
      projectId,
      photoFile,
      ...treeData
    } = createTreeDto;
    try {
      const coordinates = new Coordinates();
      coordinates.latitude = latitude;
      coordinates.longitude = longitude;
      const savedCoordinates = await queryRunner.manager.save(Coordinates, coordinates);

      const project = await this.projectService.findProject(projectId);

      let newTree = this.treeRepository.create({
        ...treeData,
        coordinate: savedCoordinates,
        neighborhood: null,
        project,
      });

      newTree = await queryRunner.manager.save(Trees, newTree);

      await this.saveManyToManyRelations(
        conflictsNames,
        this.conflictRepository,
        this.conflictTreeRepository,
        newTree,
        'conflict',
        queryRunner,
      );
      await this.saveManyToManyRelations(
        diseasesNames,
        this.diseaseRepository,
        this.diseaseTreeRepository,
        newTree,
        'disease',
        queryRunner,
      );
      await this.saveManyToManyRelations(
        interventionsNames,
        this.interventionRepository,
        this.interventionTreeRepository,
        newTree,
        'intervention',
        queryRunner,
      );
      await this.saveManyToManyRelations(pestsNames, this.pestRepository, this.pestTreeRepository, newTree, 'pest', queryRunner);

      if (createDefectsDtos?.length > 0) {
        for (const defectDto of createDefectsDtos) {
          const entity = await this.defectRepository.findOne({
            where: { defectName: defectDto.defectName },
          });

          const defectTree = this.defectTreeRepository.create({
            tree: newTree,
            defect: entity,
            defectValue: defectDto.defectValue,
            textDefectValue: defectDto.textDefectValue,
            branches: defectDto.branches,
          });
          await queryRunner.manager.save(DefectTree, defectTree);
        }
      }
      if (photoFile) {
        const pathFile = `${PATH_TREES_PHOTOS}tree_${newTree.idTree}.jpg`;
        const fileStorageService = this.fileStorageFactory.getFileStorageService();
        const uploadResult = await fileStorageService.uploadFile(photoFile, pathFile);
        // Save the returned URL to the tree object
        newTree.pathPhoto = uploadResult.url;
        await queryRunner.manager.save(Trees, newTree);
      }
      await queryRunner.commitTransaction();
      return newTree.idTree;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async saveManyToManyRelations(
    names: string[], // Array of entity names (e.g., pestNames, diseaseNames)
    entityRepository: Repository<any>, // Repository for the main entity (e.g., pestRepository, diseaseRepository)
    relationRepository: Repository<any>, // Repository for the relation (e.g., pestTreeRepository)
    tree: Trees, // The tree entity being associated
    entityField: string, // The field name in the relation entity (e.g., 'pest' or 'disease')
    queryRunner: any,
  ) {
    if (names?.length > 0) {
      for (const name of names) {
        let entity = await entityRepository.findOne({
          where: { [entityField + 'Name']: name },
        });

        // If entityField is 'disease' or 'pest' and entity does not exist, create it
        if ((entityField === 'disease' || entityField === 'pest') && !entity) {
          entity = entityRepository.create({ [`${entityField}Name`]: name });
          entity = await queryRunner.manager.save(entityRepository.target, entity);
        }

        if (entity) {
          const relation = relationRepository.create({
            tree: tree,
            [entityField]: entity, // Dynamically set the field (e.g., 'pest', 'disease')
          });
          await queryRunner.manager.save(relationRepository.target, relation);
        }
      }
    }
  }

  async findAllTreesByIdProject(idProject: number): Promise<SimplyReadTreeDto[]> {
    const trees = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoinAndSelect('tree.project', 'project')
      .innerJoinAndSelect('tree.coordinate', 'coordinate')
      .where('project.idProject = :idProject', { idProject })
      .select([
        'tree.idTree AS "idTree"',
        'tree.address AS "address"',
        'tree.datetime AS "datetime"',
        'tree.treeValue AS "treeValue"',
        'tree.risk AS "risk"',
        'tree.height AS "height"',
        'coordinate.idCoordinate AS "idCoordinate"',
        'coordinate.latitude AS "latitude"',
        'coordinate.longitude AS "longitude"',
      ])
      .orderBy('tree.idTree', 'ASC')
      .getRawMany();

    return trees;
  }

  async getCoordinatesTreesByIdProject(idProject: number) {
    const trees = await this.treeRepository

      .createQueryBuilder('tree')
      .innerJoinAndSelect('tree.project', 'project')
      .innerJoinAndSelect('tree.coordinate', 'coordinate')
      .where('project.idProject = :idProject', { idProject })
      .select([
        'tree.idTree AS "idTree"',
        'coordinate.idCoordinate AS "idCoordinate"',
        'coordinate.latitude AS "latitude"',
        'coordinate.longitude AS "longitude"',
      ])
      .getRawMany();
    return trees;
  }
  async findTreeById(idTree: number): Promise<ReadTreeDto> {
    const tree = await this.treeRepository
      .createQueryBuilder('tree')
      .leftJoinAndSelect('tree.coordinate', 'coordinate')
      .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
      .leftJoinAndSelect('tree.conflictTrees', 'conflictTrees')
      .leftJoinAndSelect('conflictTrees.conflict', 'conflict')
      .leftJoinAndSelect('tree.defectTrees', 'defectTrees')
      .leftJoinAndSelect('defectTrees.defect', 'defect')
      .leftJoinAndSelect('tree.diseaseTrees', 'diseaseTrees')
      .leftJoinAndSelect('diseaseTrees.disease', 'disease')
      .leftJoinAndSelect('tree.interventionTrees', 'interventionTrees')
      .leftJoinAndSelect('interventionTrees.intervention', 'intervention')
      .leftJoinAndSelect('tree.pestTrees', 'pestTrees')
      .leftJoinAndSelect('pestTrees.pest', 'pest')
      .where('tree.idTree = :idTree', { idTree })
      .getOne();

    if (!tree) {
      return null;
    }
    let treeInfoCollectionTime: string | null = null;
    if (tree.treeInfoCollectionStartTime) {
      const diffMs = tree.datetime.getTime() - tree.treeInfoCollectionStartTime.getTime();
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      treeInfoCollectionTime = `${hours}:${minutes}:${seconds}`;
    }

    const readTreeDto: ReadTreeDto = {
      idTree: tree.idTree,
      datetime: tree.datetime,
      pathPhoto: tree.pathPhoto,
      cityBlock: tree.cityBlock,
      perimeter: tree.perimeter,
      height: tree.height,
      incline: tree.incline,
      treesInTheBlock: tree.treesInTheBlock,
      useUnderTheTree: tree.useUnderTheTree,
      frequencyUse: tree.frequencyUse,
      potentialDamage: tree.potentialDamage,
      isMovable: tree.isMovable,
      isRestrictable: tree.isRestrictable,
      isMissing: tree.isMissing,
      isDead: tree.isDead,
      exposedRoots: tree.exposedRoots,
      dch: tree.dch,
      windExposure: tree.windExposure,
      vigor: tree.vigor,
      canopyDensity: tree.canopyDensity,
      growthSpace: tree.growthSpace,
      treeValue: tree.treeValue,
      streetMateriality: tree.streetMateriality,
      risk: tree.risk,
      address: tree.address,
      latitude: tree.coordinate?.latitude,
      longitude: tree.coordinate?.longitude,
      neighborhoodName: tree.neighborhood?.neighborhoodName,
      treeTypeName: tree.treeTypeName,
      gender: tree.gender,
      species: tree.species,
      scientificName: tree.scientificName,
      treeInfoCollectionTime: treeInfoCollectionTime,
      conflictsNames: tree.conflictTrees?.map((conflictTree) => conflictTree.conflict?.conflictName),
      diseasesNames: tree.diseaseTrees?.map((diseaseTree) => diseaseTree.disease?.diseaseName),
      interventionsNames: tree.interventionTrees?.map((interventionTree) => interventionTree.intervention?.interventionName),
      pestsNames: tree.pestTrees?.map((pestTree) => pestTree.pest?.pestName),
      readDefectDto: tree.defectTrees.map((defectTree) => ({
        defectName: defectTree.defect?.defectName,
        defectZone: defectTree.defect?.defectZone,
        defectValue: defectTree.defectValue,
        textDefectValue: defectTree.textDefectValue,
        branches: defectTree.branches,
      })),
    };

    return readTreeDto;
  }
  // async findAllTreesByIdProject(idProject: number): Promise<ReadTreeDto[]> {
  //   const rawTrees = await this.treeRepository
  //     .createQueryBuilder('tree')
  //     .leftJoinAndSelect('tree.coordinate', 'coordinate')
  //     .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
  //     .leftJoinAndSelect('tree.conflictTrees', 'conflictTrees')
  //     .leftJoinAndSelect('conflictTrees.conflict', 'conflict')
  //     .leftJoinAndSelect('tree.defectTrees', 'defectTrees')
  //     .leftJoinAndSelect('defectTrees.defect', 'defect')
  //     .leftJoinAndSelect('tree.diseaseTrees', 'diseaseTrees')
  //     .leftJoinAndSelect('diseaseTrees.disease', 'disease')
  //     .leftJoinAndSelect('tree.project', 'project')
  //     .leftJoinAndSelect('tree.interventionTrees', 'interventionTrees')
  //     .leftJoinAndSelect('interventionTrees.intervention', 'intervention')
  //     .leftJoinAndSelect('tree.pestTrees', 'pestTrees')
  //     .leftJoinAndSelect('pestTrees.pest', 'pest')
  //     .where('project.idProject = :idProject', { idProject })
  //     .select([
  //       'tree.id_tree AS idTree',
  //       'tree.tree_name AS treeName',
  //       'MAX(tree.datetime) AS datetime',
  //       'tree.path_photo AS pathPhoto',
  //       'tree.city_block AS cityBlock',
  //       'tree.perimeter AS perimeter',
  //       'tree.height AS height',
  //       'tree.incline AS incline',
  //       'tree.trees_in_the_block AS treesInTheBlock',
  //       'tree.use_under_the_tree AS useUnderTheTree',
  //       'tree.frequency_use AS frequencyUse',
  //       'tree.potential_damage AS potentialDamage',
  //       'tree.is_movable AS isMovable',
  //       'tree.is_restrictable AS isRestrictable',
  //       'tree.is_missing AS isMissing',
  //       'tree.is_dead AS isDead',
  //       'tree.exposed_roots AS exposedRoots',
  //       'tree.dch AS dch',
  //       'tree.wind_exposure AS windExposure',
  //       'tree.vigor AS vigor',
  //       'tree.canopy_density AS canopyDensity',
  //       'tree.growth_space AS growthSpace',
  //       'tree.tree_value AS treeValue',
  //       'tree.street_materiality AS streetMateriality',
  //       'tree.risk AS risk',
  //       'tree.address AS address',
  //       'coordinate.latitude AS latitude',
  //       'coordinate.longitude AS longitude',
  //       'neighborhood.neighborhood_name AS neighborhoodName',
  //       'array_agg(DISTINCT conflict.conflict_name) AS conflictsNames',
  //       'array_agg(DISTINCT disease.disease_name) AS diseasesNames',
  //       'array_agg(DISTINCT intervention.intervention_name) AS interventionsNames',
  //       'array_agg(DISTINCT pest.pest_name) AS pestsNames',
  //       'json_agg(DISTINCT jsonb_build_object(' +
  //         '\'defectName\', defect.defect_name, ' +
  //         '\'defectZone\', defect.defect_zone, ' +
  //         '\'defectValue\', defectTrees.defect_value, ' +
  //         '\'textDefectValue\', defectTrees.text_defect_value, ' +
  //         '\'branches\', defectTrees.branches' +
  //       ')) AS defectDto',
  //     ])
  //     .groupBy('tree.id_tree, coordinate.id_coordinate, neighborhood.id_neighborhood')
  //     .getRawMany();

  //   return rawTrees.map((tree) => ({
  //     idTree: tree.idTree,
  //     treeName: tree.treeName,
  //     datetime: tree.datetime,
  //     pathPhoto: tree.pathPhoto,
  //     cityBlock: tree.cityBlock,
  //     perimeter: tree.perimeter,
  //     height: tree.height,
  //     incline: tree.incline,
  //     treesInTheBlock: tree.treesInTheBlock,
  //     useUnderTheTree: tree.useUnderTheTree,
  //     frequencyUse: tree.frequencyUse,
  //     potentialDamage: tree.potentialDamage,
  //     isMovable: tree.isMovable,
  //     isRestrictable: tree.isRestrictable,
  //     isMissing: tree.isMissing,
  //     isDead: tree.isDead,
  //     exposedRoots: tree.exposedRoots,
  //     dch: tree.dch,
  //     windExposure: tree.windExposure,
  //     vigor: tree.vigor,
  //     canopyDensity: tree.canopyDensity,
  //     growthSpace: tree.growthSpace,
  //     treeValue: tree.treeValue,
  //     streetMateriality: tree.streetMateriality,
  //     risk: tree.risk,
  //     address: tree.address,
  //     latitude: tree.latitude,
  //     longitude: tree.longitude,
  //     neighborhoodName: tree.neighborhoodName,
  //     treeTypeName: tree.treeTypeName,
  //     conflictsNames: tree.conflictsNames || [],
  //     diseasesNames: tree.diseasesNames || [],
  //     interventionsNames: tree.interventionsNames || [],
  //     pestsNames: tree.pestsNames || [],
  //     defectDto: tree.defectDto || [],
  //   }));
  // }

  // Find all the trees by project in simply dto that has general information of tree
  async findAllTreesByIdProject1(idProject: number): Promise<ReadTreeDto[]> {
    const trees = await this.treeRepository
      .createQueryBuilder('tree')
      .leftJoinAndSelect('tree.coordinate', 'coordinate')
      .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
      .leftJoinAndSelect('tree.conflictTrees', 'conflictTrees')
      .leftJoinAndSelect('conflictTrees.conflict', 'conflict')
      .leftJoinAndSelect('tree.defectTrees', 'defectTrees')
      .leftJoinAndSelect('defectTrees.defect', 'defect')
      .leftJoinAndSelect('tree.diseaseTrees', 'diseaseTrees')
      .leftJoinAndSelect('diseaseTrees.disease', 'disease')
      .leftJoinAndSelect('tree.project', 'project')
      .leftJoinAndSelect('tree.interventionTrees', 'interventionTrees')
      .leftJoinAndSelect('interventionTrees.intervention', 'intervention')
      .leftJoinAndSelect('tree.pestTrees', 'pestTrees')
      .leftJoinAndSelect('pestTrees.pest', 'pest')
      .where('project.idProject = :idProject', { idProject })
      .groupBy('tree.id_tree, coordinate.id_coordinate, neighborhood.id_neighborhood')
      .getRawMany();

    return trees.map((tree) => ({
      idTree: tree.idTree,
      treeName: tree.treeName,
      datetime: tree.datetime,
      pathPhoto: tree.pathPhoto,
      cityBlock: tree.cityBlock,
      perimeter: tree.perimeter,
      height: tree.height,
      incline: tree.incline,
      treesInTheBlock: tree.treesInTheBlock,
      useUnderTheTree: tree.useUnderTheTree,
      frequencyUse: tree.frequencyUse,
      potentialDamage: tree.potentialDamage,
      isMovable: tree.isMovable,
      isRestrictable: tree.isRestrictable,
      isMissing: tree.isMissing,
      isDead: tree.isDead,
      exposedRoots: tree.exposedRoots,
      dch: tree.dch,
      windExposure: tree.windExposure,
      vigor: tree.vigor,
      canopyDensity: tree.canopyDensity,
      growthSpace: tree.growthSpace,
      treeValue: tree.treeValue,
      streetMateriality: tree.streetMateriality,
      risk: tree.risk,
      address: tree.address,
      latitude: tree.coordinate?.latitude,
      longitude: tree.coordinate?.longitude,
      neighborhoodName: tree.neighborhood?.neighborhoodName,
      treeTypeName: tree.treeTypeName,
      gender: tree.gender,
      species: tree.species,
      scientificName: tree.scientificName,
      conflictsNames: tree.conflictTrees?.map((conflictTree) => conflictTree.conflict?.conflictName),
      diseasesNames: tree.diseaseTrees?.map((diseaseTree) => diseaseTree.disease?.diseaseName),
      interventionsNames: tree.interventionTrees?.map((interventionTree) => interventionTree.intervention?.interventionName),
      pestsNames: tree.pestTrees?.map((pestTree) => pestTree.pest?.pestName),
      readDefectDto: tree.defectTrees?.map((defectTree) => ({
        defectName: defectTree.defect?.defectName,
        defectZone: defectTree.defect?.defectZone,
        defectValue: defectTree.defectValue,
        textDefectValue: defectTree.textDefectValue,
        branches: defectTree.branches,
      })),
    }));
  }

  async updateTreeById(idTree: number, createTreeDto: CreateTreeDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const {
      conflictsNames,
      createDefectsDtos,
      diseasesNames,
      interventionsNames,
      pestsNames,
      latitude,
      longitude,
      projectId,
      photoFile,
      ...treeData
    } = createTreeDto;

    try {
      const existingTree = await queryRunner.manager.findOne(Trees, {
        where: { idTree },
        relations: ['coordinate', 'project', 'conflictTrees', 'diseaseTrees', 'interventionTrees', 'pestTrees', 'defectTrees'],
      });

      if (!existingTree) {
        throw new Error('Tree not found');
      }

      // Update coordinates
      if (latitude && longitude) {
        existingTree.coordinate.latitude = latitude;
        existingTree.coordinate.longitude = longitude;
        await queryRunner.manager.save(Coordinates, existingTree.coordinate);
      }

      // Update project if changed
      if (projectId) {
        const project = await this.projectService.findProject(projectId);
        await queryRunner.manager.update(Trees, { idTree }, { project });
      }

      // Update tree data
      Object.assign(existingTree, treeData);

      // Update datetime with current timestamp
      existingTree.datetime = new Date();

      // Save updated tree
      const updatedTree = await queryRunner.manager.save(Trees, existingTree);

      // Update many-to-many relations
      // First, remove existing relations
      await queryRunner.manager.delete(ConflictTree, { tree: { idTree } });
      await queryRunner.manager.delete(DiseaseTree, { tree: { idTree } });
      await queryRunner.manager.delete(InterventionTree, { tree: { idTree } });
      await queryRunner.manager.delete(PestTree, { tree: { idTree } });
      await queryRunner.manager.delete(DefectTree, { tree: { idTree } });

      // Then create new relations
      await this.saveManyToManyRelations(
        conflictsNames,
        this.conflictRepository,
        this.conflictTreeRepository,
        updatedTree,
        'conflict',
        queryRunner,
      );

      await this.saveManyToManyRelations(
        diseasesNames,
        this.diseaseRepository,
        this.diseaseTreeRepository,
        updatedTree,
        'disease',
        queryRunner,
      );

      await this.saveManyToManyRelations(
        interventionsNames,
        this.interventionRepository,
        this.interventionTreeRepository,
        updatedTree,
        'intervention',
        queryRunner,
      );

      await this.saveManyToManyRelations(pestsNames, this.pestRepository, this.pestTreeRepository, updatedTree, 'pest', queryRunner);

      // Handle defects
      if (createDefectsDtos?.length > 0) {
        for (const defectDto of createDefectsDtos) {
          const entity = await this.defectRepository.findOne({
            where: { defectName: defectDto.defectName },
          });

          const defectTree = this.defectTreeRepository.create({
            tree: updatedTree,
            defect: entity,
            defectValue: defectDto.defectValue,
            textDefectValue: defectDto.textDefectValue,
            branches: defectDto.branches,
          });
          await queryRunner.manager.save(DefectTree, defectTree);
        }
      }
      if (photoFile) {
        const pathFile = `${PATH_TREES_PHOTOS}tree_${updatedTree.idTree}.jpg`;
        const fileStorageService = this.fileStorageFactory.getFileStorageService();
        const uploadResult = await fileStorageService.uploadFile(photoFile, pathFile);

        // Don't save the entire tree object again, just update the pathPhoto column directly
        await queryRunner.manager.update(Trees, { idTree: updatedTree.idTree }, {
          pathPhoto: uploadResult.url
        });

        // Update the local object without triggering a full save
        updatedTree.pathPhoto = uploadResult.url;
      }
      await queryRunner.commitTransaction();
      return updatedTree.idTree;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async removeTreeById(idTree: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tree = await queryRunner.manager.findOne(Trees, {
        where: { idTree },
        relations: ['coordinate'],
      });
      if (!tree) {
        await queryRunner.rollbackTransaction();
        return;
      }
      await queryRunner.manager.delete(Trees, { idTree });
      if (tree.coordinate) {
        await queryRunner.manager.remove(tree.coordinate);
      }

      await this.s3Service.deleteFile(`${PATH_TREES_PHOTOS}tree_${idTree}.jpg`);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getNeighborhoodIdByUnitWork(idProject: number, idUnitWork: number) {
    const results = await this.treeRepository
      .createQueryBuilder('tree')
      .leftJoinAndSelect('tree.project', 'project')
      .leftJoinAndSelect('project.unitWork', 'unit_work')
      .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('unit_work.idUnitWork = :idUnitWork', { idUnitWork })
      .select(['neighborhood.idNeighborhood AS "idNeighborhood"'])
      .getRawOne();

    return results.idNeighborhood;
  }

  async getFilteredTrees(idProject: number, idUnitWork: number, filterNames: string | string[]) {
    const filterNamesArray = typeof filterNames === 'string' ? [filterNames] : filterNames;

    const idNeighborhood = idUnitWork == 0 ? 0 : (await this.getNeighborhoodIdByUnitWork(idProject, idUnitWork)).idNeighborhood;

    const filters: Record<string, any> = {};
    filterNamesArray.forEach((filter) => {
      // Recorre cada valor del array y filter y divide por '='
      if (typeof filter === 'string') {
        const [key, value] = filter.split('=');
        if (key && value !== undefined) {
          filters[key] = isNaN(Number(value)) ? value : Number(value);
        }
      }
    });

    let query = this.treeRepository // Inicio query
      .createQueryBuilder('tree')
      .leftJoinAndSelect('tree.project', 'project')
      .where('project.idProject = :idProject', { idProject });

    if (idNeighborhood !== 0) {
      query = query
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood });
    }

    Object.keys(filters).forEach((key) => {
      // Agrega condiciones segun filtros
      if (['isDead', 'isMissing', 'isMovable', 'exposedRoots'].includes(key)) {
        query = query.andWhere(`tree.${key} = :${key}`, { [key]: filters[key] === 'true' });
      } else if (['dch', 'potentialDemage', 'frequencyUse', 'risk'].includes(key)) {
        query = query.andWhere(`tree.${key} = :${key}`, { [key]: filters[key] });
      } else if (['species', 'windExposure', 'vigor', 'growthSpace', 'streetMateriality', 'treeValue'].includes(key)) {
        query = query.andWhere(`tree.${key} = :${key}`, { [key]: filters[key] });
      } else if (key === 'diseases') {
        query = query
          .innerJoin('tree.diseaseTrees', 'diseaseTree')
          .innerJoin('diseaseTree.disease', 'disease')
          .andWhere('disease.diseaseName = :disease', { disease: filters[key] });
      } else if (key === 'pests') {
        query = query
          .innerJoin('tree.pestTrees', 'pestTree')
          .innerJoin('pestTree.pest', 'pest')
          .andWhere('pest.pestName = :pest', { pest: filters[key] });
      } else if (key === 'conflicts') {
        query = query
          .innerJoin('tree.conflictTrees', 'conflictTree')
          .innerJoin('conflictTree.conflict', 'conflict')
          .andWhere('conflict.conflictName = :conflict', { conflict: filters[key] });
      } else if (key === 'intervention') {
        query = query
          .innerJoin('tree.interventionTrees', 'interventionTree')
          .innerJoin('interventionTree.intervention', 'intervention')
          .andWhere('intervention.interventionName = :intervention', { intervention: filters[key] });
      }
    });

    query = query.orderBy('tree.idTree', 'ASC');
    return await query.getRawMany();
  }

  async getFiltersByProjectAndNeighborhood(idProject: number, idUnitWork: number, filterNames: string | string[]): Promise<Filter[]> {
    const filterNamesArray = typeof filterNames === 'string' ? [filterNames] : filterNames;
    let idNeighborhood = 0;

    if (idUnitWork != 0) {
      idNeighborhood = await this.getNeighborhoodIdByUnitWork(idProject, idUnitWork);
    }

    const results = await Promise.all(
      filterNamesArray.map(async (filter) => {
        let values: string[] = [];

        switch (filter) {
          case 'isMissing':
            values = await this.getValuesFilterIsMissing(idProject, idNeighborhood);
            break;
          case 'isDead':
            values = await this.getValuesFilterIsDead(idProject, idNeighborhood);
            break;
          case 'exposedRoots':
            values = await this.getValuesFilterExposedRoots(idProject, idNeighborhood);
            break;
          case 'species':
            values = await this.getValuesFilterSpecies(idProject, idNeighborhood);
            break;
          case 'pests':
            values = await this.getValuesFilterPests(idProject, idNeighborhood);
            break;
          case 'treeValue':
            values = await this.getValuesFilterTreeValue(idProject, idNeighborhood);
            break;
          case 'conflicts':
            values = await this.getValuesFilterConflicts(idProject, idNeighborhood);
            break;
          case 'windExposure':
            values = await this.getValuesFilterWindExposure(idProject, idNeighborhood);
            break;
          case 'vigor':
            values = await this.getValuesFilterVigor(idProject, idNeighborhood);
            break;
          case 'canopyDensity':
            values = await this.getValuesFilterCanopyDensity(idProject, idNeighborhood);
            break;
          case 'growthSpace':
            values = await this.getValuesFilterGrowthSpace(idProject, idNeighborhood);
            break;
          case 'risk':
            values = await this.getValuesFilterRisk(idProject, idNeighborhood);
            break;
          case 'intervention':
            values = await this.getValuesFilterInterventions(idProject, idNeighborhood);
            break;
          case 'streetMateriality':
            values = await this.getValuesFilterStreetMateriality(idProject, idNeighborhood);
            break;
          case 'diseases':
            values = await this.getValuesFilterDiseases(idProject, idNeighborhood);
            break;
          case 'potentialDemage':
            values = await this.getValuesFilterPotentialDamage(idProject, idNeighborhood);
            break;
          case 'frequencyUse':
            values = await this.getValuesFilterFrequencyUse(idProject, idNeighborhood);
            break;
          case 'dch':
            values = await this.getValuesFilterDCH(idProject, idNeighborhood);
            break;
          case 'perimeter':
            values = await this.getValuesFilterPerimeter(idProject, idNeighborhood);
            break;
          case 'isRestrictable':
            values = await this.getValuesFilterIsRestrictable(idProject, idNeighborhood);
            break;
          case 'height':
            values = await this.getValuesFilterHeight(idProject, idNeighborhood);
            break;
          case 'incline':
            values = await this.getValuesFilterIncline(idProject, idNeighborhood);
            break;
          default:
            console.warn(`Filtro desconocido: ${filter}`);
            break;
        }

        return { filterName: filter, values };
      }),
    );

    return results.filter((result) => result.values.length > 0);
  }

  async getTreesData(idProject: number, idUnitWork: number) {}

  async getValuesFilterIsMissing(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.isMissing) AS "isMissing"'])
        .orderBy('tree.isMissing', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.isMissing) AS "isMissing"'])
        .orderBy('tree.isMissing', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      isMissing: result.isMissing === true ? 'Sí' : result.isMissing === false ? 'No' : 'No especifica',
    }));
  }

  async getValuesFilterIsMovable(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.isMovable) AS "isMovable"'])
        .orderBy('tree.isMovable', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.isMovable) AS "isMovable"'])
        .orderBy('tree.isMovable', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      isMovable: result.isMovable ? 'Sí' : result.isMovable === false ? 'No' : 'No especifica',
    }));
  }

  async getValuesFilterPotentialDamage(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.potentialDamage) AS "potentialDamage"'])
        .orderBy('tree.potentialDamage', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.potentialDamage) AS "potentialDamage"'])
        .orderBy('tree.potentialDamage', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      potentialDamage: result.potentialDamage ? result.potentialDamage : 'No especifica',
    }));
  }

  async getValuesFilterFrequencyUse(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.frequencyUse) AS "frequencyUse"'])
        .orderBy('tree.frequencyUse', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.frequencyUse) AS "frequencyUse"'])
        .orderBy('tree.frequencyUse', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      frequencyUse: result.frequencyUse !== null ? result.frequencyUse : 'No especifica',
    }));
  }

  async getValuesFilterPerimeter(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.perimeter) AS "perimeter"'])
        .orderBy('tree.perimeter', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.perimeter) AS "perimeter"'])
        .orderBy('tree.perimeter', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      perimeter: result.perimeter !== null ? result.perimeter : 'No especifica',
    }));
  }

  async getValuesFilterIncline(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.incline) AS "incline"'])
        .orderBy('tree.incline', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.incline) AS "incline"'])
        .orderBy('tree.incline', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      incline: result.incline !== null ? result.incline : 'No especifica',
    }));
  }

  async getValuesFilterHeight(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.height) AS "height"'])
        .orderBy('tree.height', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.height) AS "height"'])
        .orderBy('tree.height', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      height: result.height !== null ? result.height : 'No especifica',
    }));
  }

  async getValuesFilterIsRestrictable(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.isRestrictable) AS "isRestrictable"'])
        .orderBy('tree.isRestrictable', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.isRestrictable) AS "isRestrictable"'])
        .orderBy('tree.isRestrictable', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      isRestrictable: result.isRestrictable === true ? 'Sí' : result.isRestrictable === false ? 'No' : 'No especifica',
    }));
  }

  async getValuesFilterDCH(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.DCH) AS "DCH"'])
        .orderBy('tree.DCH', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.DCH) AS "DCH"'])
        .orderBy('tree.DCH', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      DCH: result.DCH !== null ? result.DCH : 'No especifica',
    }));
  }

  async getValuesFilterDiseases(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.diseaseTrees', 'diseaseTree')
        .leftJoinAndSelect('diseaseTree.disease', 'disease')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (disease.diseaseName) AS "diseases"'])
        .orderBy('disease.diseaseName', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .leftJoinAndSelect('tree.diseaseTrees', 'diseaseTree')
        .leftJoinAndSelect('diseaseTree.disease', 'disease')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (disease.diseaseName) AS "diseases"'])
        .orderBy('disease.diseaseName', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      diseases: result.diseases !== null ? result.diseases : 'No especifica',
    }));
  }

  async getValuesFilterInterventions(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.interventionTrees', 'interventionTree')
        .leftJoinAndSelect('interventionTree.intervention', 'intervention')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (intervention.interventionName) AS "intervention"'])
        .orderBy('intervention.interventionName', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .leftJoinAndSelect('tree.interventionTrees', 'interventionTree')
        .leftJoinAndSelect('interventionTree.intervention', 'intervention')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (intervention.interventionName) AS "intervention"'])
        .orderBy('intervention.interventionName', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      intervention: result.intervention !== null ? result.intervention : 'No especifica',
    }));
  }

  async getValuesFilterPests(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.pestTrees', 'pestTree')
        .leftJoinAndSelect('pestTree.pest', 'pest')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (pest.pestName) AS "pests"'])
        .orderBy('pest.pestName', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .leftJoinAndSelect('tree.pestTrees', 'pestTree')
        .leftJoinAndSelect('pestTree.pest', 'pest')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (pest.pestName) AS "pests"'])
        .orderBy('pest.pestName', 'ASC')
        .getRawMany();
    }
    return results.map((result) => ({
      pests: result.pests ? result.pests : 'No especifica',
    }));
  }

  async getValuesFilterConflicts(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.conflictTrees', 'conflictTree')
        .leftJoinAndSelect('conflictTree.conflict', 'conflict')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (conflict.conflictName) AS "conflicts"'])
        .orderBy('conflict.conflictName', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .leftJoinAndSelect('tree.conflictTrees', 'conflictTree')
        .leftJoinAndSelect('conflictTree.conflict', 'conflict')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (conflict.conflictName) AS "conflicts"'])
        .orderBy('conflict.conflictName', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      conflicts: result.conflicts !== null ? result.conflicts : 'No especifica',
    }));
  }

  async getValuesFilterIsDead(idProject: number, idNeighborhood: number) {
    let results;

    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.isDead) AS "isDead"'])
        .orderBy('tree.isDead', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.isDead) AS "isDead"'])
        .orderBy('tree.isDead', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      isDead: result.isDead === true ? 'Sí' : result.isDead === false ? 'No' : 'No especifica',
    }));
  }

  async getValuesFilterStreetMateriality(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.streetMateriality) AS "streetMateriality"'])
        .orderBy('tree.streetMateriality', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.streetMateriality) AS "streetMateriality"'])
        .orderBy('tree.streetMateriality', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      streetMateriality: result.streetMateriality !== null ? result.streetMateriality : 'No especifica',
    }));
  }

  async getValuesFilterGrowthSpace(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.growthSpace) AS "growthSpace"'])
        .orderBy('tree.growthSpace', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.growthSpace) AS "growthSpace"'])
        .orderBy('tree.growthSpace', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      growthSpace: result.growthSpace !== null ? result.growthSpace : 'No especifica',
    }));
  }

  async getValuesFilterCanopyDensity(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.canopyDensity) AS "canopyDensity"'])
        .orderBy('tree.canopyDensity', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.canopyDensity) AS "canopyDensity"'])
        .orderBy('tree.canopyDensity', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      canopyDensity: result.canopyDensity !== null ? result.canopyDensity : 'No especifica',
    }));
  }

  async getValuesFilterWindExposure(idProject: number, idNeighborhood: number) {
    let results;

    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.windExposure) AS "windExposure"'])
        .orderBy('tree.windExposure', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.windExposure) AS "windExposure"'])
        .orderBy('tree.windExposure', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      windExposure: result.windExposure !== null ? result.windExposure : 'No especifica',
    }));
  }

  async getValuesFilterExposedRoots(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.exposedRoots) AS "exposedRoots"'])
        .orderBy('tree.exposedRoots', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.exposedRoots) AS "exposedRoots"'])
        .orderBy('tree.exposedRoots', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      exposedRoots: result.exposedRoots === true ? 'Sí' : result.exposedRoots === false ? 'No' : 'No especifica',
    }));
  }

  async getValuesFilterTreeValue(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.treeValue) AS "treeValue"'])
        .orderBy('tree.treeValue', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.treeValue) AS "treeValue"'])
        .orderBy('tree.treeValue', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      treeValue: result.treeValue !== null ? result.treeValue : 'No especifica',
    }));
  }

  async getValuesFilterRisk(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.risk) AS "risk"'])
        .orderBy('tree.risk', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.risk) AS "risk"'])
        .orderBy('tree.risk', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      risk: result.risk !== null ? result.risk : 'No especifica',
    }));
  }

  async getValuesFilterVigor(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.vigor) AS "vigor"'])
        .orderBy('tree.vigor', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.vigor) AS "vigor"'])
        .orderBy('tree.vigor', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      vigor: result.vigor !== null ? result.vigor : 'No especifica',
    }));
  }

  async getValuesFilterSpecies(idProject: number, idNeighborhood: number) {
    var results;
    if (idNeighborhood == 0) {
      // Proyecto individual: no importa el barrio
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .select(['DISTINCT (tree.species) AS "species"'])
        .orderBy('tree.species', 'ASC')
        .getRawMany();
    } else {
      results = await this.treeRepository
        .createQueryBuilder('tree')
        .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
        .leftJoinAndSelect('tree.project', 'project')
        .where('project.idProject = :idProject', { idProject })
        .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
        .select(['DISTINCT (tree.species) AS "species"'])
        .orderBy('tree.species', 'ASC')
        .getRawMany();
    }

    return results.map((result) => ({
      species: result.species !== null ? result.species : 'No especifica',
    }));
  }
}
