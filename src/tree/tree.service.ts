import { Injectable } from '@nestjs/common';
import { CreateTreeDto } from './dto/create-tree.dto';
import { DataSource, Repository } from 'typeorm';
import { Filter } from './dto/filter';
import { Trees } from './entities/Trees';
import { InjectRepository } from '@nestjs/typeorm';
import { Pests } from './entities/Pests';
import { ProjectService } from '../project/project.service';
import { Coordinates } from '../location/entities/Coordinates';
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

  async findAllTreesByIdProject(idProject: number, idUnitWork?: number, idUser?: number, role?: string): Promise<SimplyReadTreeDto[]> {
    // Access check: throws ForbiddenException if role doesn't have access to this project
    await this.projectService.findProject(idProject, idUser, role);

    const qb = this.treeRepository
      .createQueryBuilder('tree')
      .innerJoinAndSelect('tree.project', 'project')
      .innerJoinAndSelect('tree.coordinate', 'coordinate')
      .leftJoinAndSelect('tree.neighborhood', 'neighborhood')
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
        'neighborhood.idNeighborhood AS "idNeighborhood"',
        'neighborhood.neighborhoodName AS "neighborhoodName"',
        'tree.treeTypeName AS "treeTypeName"',
        'tree.dch AS "dch"',
      ]);

    if (idUnitWork) {
      qb.andWhere('neighborhood.idNeighborhood = (SELECT uw.neighborhood_id FROM unit_work uw WHERE uw.id_unit_work = :idUnitWork)', {
        idUnitWork,
      });
    }

    return qb.orderBy('tree.idTree', 'ASC').getRawMany();
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
      idNeighborhood: tree.neighborhood?.idNeighborhood ?? null,
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
        await queryRunner.manager.update(
          Trees,
          { idTree: updatedTree.idTree },
          {
            pathPhoto: uploadResult.url,
          },
        );

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

  async getFilteredTrees(idProject: number, filters: Record<string, string[]>, neighborhoodIds?: number[]): Promise<ReadTreeDto[]> {
    let query = this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
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
      .where('project.idProject = :idProject', { idProject });

    if (neighborhoodIds && neighborhoodIds.length > 0) {
      query = query.andWhere('neighborhood.idNeighborhood IN (:...neighborhoodIds)', { neighborhoodIds });
    }

    Object.keys(filters).forEach((key) => {
      const values = filters[key];
      if (!values || values.length === 0) return;

      if (['isDead', 'isMissing', 'isMovable', 'exposedRoots'].includes(key)) {
        query = query.andWhere(`tree.${key} = :${key}`, { [key]: values[0] === 'true' });
      } else if (['dch', 'potentialDamage', 'frequencyUse', 'risk'].includes(key)) {
        query =
          values.length > 1
            ? query.andWhere(`tree.${key} IN (:...${key}vals)`, { [`${key}vals`]: values.map(Number) })
            : query.andWhere(`tree.${key} = :${key}`, { [key]: Number(values[0]) });
      } else if (
        ['species', 'treeTypeName', 'windExposure', 'vigor', 'canopyDensity', 'growthSpace', 'streetMateriality', 'treeValue'].includes(key)
      ) {
        query =
          values.length > 1
            ? query.andWhere(`tree.${key} IN (:...${key}vals)`, { [`${key}vals`]: values })
            : query.andWhere(`tree.${key} = :${key}`, { [key]: values[0] });
      } else if (key === 'diseases') {
        query = query.andWhere('disease.diseaseName IN (:...diseaseVals)', { diseaseVals: values });
      } else if (key === 'pests') {
        query = query.andWhere('pest.pestName IN (:...pestVals)', { pestVals: values });
      } else if (key === 'conflicts') {
        query = query.andWhere('conflict.conflictName IN (:...conflictVals)', { conflictVals: values });
      } else if (key === 'intervention') {
        query = query.andWhere('intervention.interventionName IN (:...interventionVals)', { interventionVals: values });
      }
    });

    const trees = await query.orderBy('tree.idTree', 'ASC').getMany();

    return trees.map((tree) => {
      let treeInfoCollectionTime: string | null = null;
      if (tree.treeInfoCollectionStartTime) {
        const diffMs = tree.datetime.getTime() - tree.treeInfoCollectionStartTime.getTime();
        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        treeInfoCollectionTime = `${hours}:${minutes}:${seconds}`;
      }
      return {
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
        idNeighborhood: tree.neighborhood?.idNeighborhood,
        neighborhoodName: tree.neighborhood?.neighborhoodName,
        treeTypeName: tree.treeTypeName,
        gender: tree.gender,
        species: tree.species,
        scientificName: tree.scientificName,
        treeInfoCollectionTime,
        conflictsNames: tree.conflictTrees?.map((ct) => ct.conflict?.conflictName),
        diseasesNames: tree.diseaseTrees?.map((dt) => dt.disease?.diseaseName),
        interventionsNames: tree.interventionTrees?.map((it) => it.intervention?.interventionName),
        pestsNames: tree.pestTrees?.map((pt) => pt.pest?.pestName),
        readDefectDto: tree.defectTrees?.map((dt) => ({
          defectName: dt.defect?.defectName,
          defectZone: dt.defect?.defectZone,
          defectValue: dt.defectValue,
          textDefectValue: dt.textDefectValue,
          branches: dt.branches,
        })),
      };
    });
  }

  async getFiltersByProjectAndNeighborhood(idProject: number, idUnitWork: number, filterNames: string | string[]): Promise<Filter[]> {
    const filterNamesArray = typeof filterNames === 'string' ? [filterNames] : filterNames;
    let idNeighborhood = 0;

    if (idUnitWork != 0) {
      idNeighborhood = await this.getNeighborhoodIdByUnitWork(idProject, idUnitWork);
    }

    const results = await Promise.all(
      filterNamesArray.map(async (filter) => {
        let values: Record<string, any>[] = [];

        values = await this.getValuesFilter(filter, idProject, idNeighborhood);

        return { filterName: filter, values };
      }),
    );

    return results.filter((result) => result.values.length > 0);
  }

  private readonly filterConfigs: Record<
    string,
    {
      select: string;
      orderBy: string;
      resultKey: string;
      mapperType: 'boolean' | 'booleanTruthy' | 'truthy' | 'nullCheck';
      extraJoins?: Array<{ path: string; alias: string }>;
    }
  > = {
    isMissing: {
      select: 'DISTINCT (tree.isMissing) AS "isMissing"',
      orderBy: 'tree.isMissing',
      resultKey: 'isMissing',
      mapperType: 'boolean',
    },
    isMovable: {
      select: 'DISTINCT (tree.isMovable) AS "isMovable"',
      orderBy: 'tree.isMovable',
      resultKey: 'isMovable',
      mapperType: 'booleanTruthy',
    },
    potentialDemage: {
      select: 'DISTINCT (tree.potentialDamage) AS "potentialDamage"',
      orderBy: 'tree.potentialDamage',
      resultKey: 'potentialDamage',
      mapperType: 'truthy',
    },
    frequencyUse: {
      select: 'DISTINCT (tree.frequencyUse) AS "frequencyUse"',
      orderBy: 'tree.frequencyUse',
      resultKey: 'frequencyUse',
      mapperType: 'nullCheck',
    },
    perimeter: {
      select: 'DISTINCT (tree.perimeter) AS "perimeter"',
      orderBy: 'tree.perimeter',
      resultKey: 'perimeter',
      mapperType: 'nullCheck',
    },
    incline: { select: 'DISTINCT (tree.incline) AS "incline"', orderBy: 'tree.incline', resultKey: 'incline', mapperType: 'nullCheck' },
    height: { select: 'DISTINCT (tree.height) AS "height"', orderBy: 'tree.height', resultKey: 'height', mapperType: 'nullCheck' },
    isRestrictable: {
      select: 'DISTINCT (tree.isRestrictable) AS "isRestrictable"',
      orderBy: 'tree.isRestrictable',
      resultKey: 'isRestrictable',
      mapperType: 'boolean',
    },
    dch: { select: 'DISTINCT (tree.DCH) AS "DCH"', orderBy: 'tree.DCH', resultKey: 'DCH', mapperType: 'nullCheck' },
    isDead: { select: 'DISTINCT (tree.isDead) AS "isDead"', orderBy: 'tree.isDead', resultKey: 'isDead', mapperType: 'boolean' },
    streetMateriality: {
      select: 'DISTINCT (tree.streetMateriality) AS "streetMateriality"',
      orderBy: 'tree.streetMateriality',
      resultKey: 'streetMateriality',
      mapperType: 'nullCheck',
    },
    growthSpace: {
      select: 'DISTINCT (tree.growthSpace) AS "growthSpace"',
      orderBy: 'tree.growthSpace',
      resultKey: 'growthSpace',
      mapperType: 'nullCheck',
    },
    canopyDensity: {
      select: 'DISTINCT (tree.canopyDensity) AS "canopyDensity"',
      orderBy: 'tree.canopyDensity',
      resultKey: 'canopyDensity',
      mapperType: 'nullCheck',
    },
    windExposure: {
      select: 'DISTINCT (tree.windExposure) AS "windExposure"',
      orderBy: 'tree.windExposure',
      resultKey: 'windExposure',
      mapperType: 'nullCheck',
    },
    exposedRoots: {
      select: 'DISTINCT (tree.exposedRoots) AS "exposedRoots"',
      orderBy: 'tree.exposedRoots',
      resultKey: 'exposedRoots',
      mapperType: 'boolean',
    },
    treeValue: {
      select: 'DISTINCT (tree.treeValue) AS "treeValue"',
      orderBy: 'tree.treeValue',
      resultKey: 'treeValue',
      mapperType: 'nullCheck',
    },
    treeTypeName: {
      select: 'DISTINCT (tree.treeTypeName) AS "treeTypeName"',
      orderBy: 'tree.treeTypeName',
      resultKey: 'treeTypeName',
      mapperType: 'nullCheck',
    },
    risk: { select: 'DISTINCT (tree.risk) AS "risk"', orderBy: 'tree.risk', resultKey: 'risk', mapperType: 'nullCheck' },
    vigor: { select: 'DISTINCT (tree.vigor) AS "vigor"', orderBy: 'tree.vigor', resultKey: 'vigor', mapperType: 'nullCheck' },
    species: { select: 'DISTINCT (tree.species) AS "species"', orderBy: 'tree.species', resultKey: 'species', mapperType: 'nullCheck' },
    diseases: {
      select: 'DISTINCT (disease.diseaseName) AS "diseases"',
      orderBy: 'disease.diseaseName',
      resultKey: 'diseases',
      mapperType: 'nullCheck',
      extraJoins: [
        { path: 'tree.diseaseTrees', alias: 'diseaseTree' },
        { path: 'diseaseTree.disease', alias: 'disease' },
      ],
    },
    intervention: {
      select: 'DISTINCT (intervention.interventionName) AS "intervention"',
      orderBy: 'intervention.interventionName',
      resultKey: 'intervention',
      mapperType: 'nullCheck',
      extraJoins: [
        { path: 'tree.interventionTrees', alias: 'interventionTree' },
        { path: 'interventionTree.intervention', alias: 'intervention' },
      ],
    },
    pests: {
      select: 'DISTINCT (pest.pestName) AS "pests"',
      orderBy: 'pest.pestName',
      resultKey: 'pests',
      mapperType: 'truthy',
      extraJoins: [
        { path: 'tree.pestTrees', alias: 'pestTree' },
        { path: 'pestTree.pest', alias: 'pest' },
      ],
    },
    conflicts: {
      select: 'DISTINCT (conflict.conflictName) AS "conflicts"',
      orderBy: 'conflict.conflictName',
      resultKey: 'conflicts',
      mapperType: 'nullCheck',
      extraJoins: [
        { path: 'tree.conflictTrees', alias: 'conflictTree' },
        { path: 'conflictTree.conflict', alias: 'conflict' },
      ],
    },
  };

  private async queryDistinctField(
    idProject: number,
    idNeighborhood: number,
    select: string,
    orderBy: string,
    extraJoins: Array<{ path: string; alias: string }> = [],
  ): Promise<Record<string, any>[]> {
    const qb = this.treeRepository.createQueryBuilder('tree').leftJoinAndSelect('tree.project', 'project');

    for (const join of extraJoins) {
      qb.leftJoinAndSelect(join.path, join.alias);
    }

    qb.where('project.idProject = :idProject', { idProject });

    if (idNeighborhood !== 0) {
      qb.leftJoinAndSelect('tree.neighborhood', 'neighborhood').andWhere('neighborhood.idNeighborhood = :idNeighborhood', {
        idNeighborhood,
      });
    }

    return qb.select([select]).orderBy(orderBy, 'ASC').getRawMany();
  }

  private mapFilterValue(value: any, mapperType: string): string {
    if (mapperType === 'boolean') {
      return value === true ? 'Sí' : value === false ? 'No' : 'No especifica';
    }
    if (mapperType === 'booleanTruthy') {
      return value ? 'Sí' : value === false ? 'No' : 'No especifica';
    }
    if (mapperType === 'truthy') {
      return value ? value : 'No especifica';
    }
    return value !== null ? value : 'No especifica';
  }

  private async getValuesFilter(filterName: string, idProject: number, idNeighborhood: number): Promise<Record<string, any>[]> {
    const config = this.filterConfigs[filterName];
    if (!config) {
      console.warn(`Filtro desconocido: ${filterName}`);
      return [];
    }

    const results = await this.queryDistinctField(idProject, idNeighborhood, config.select, config.orderBy, config.extraJoins);

    return results.map((result) => ({
      [config.resultKey]: this.mapFilterValue(result[config.resultKey], config.mapperType),
    }));
  }

  async getNeighborhoodsByProject(idProject: number): Promise<
    {
      idNeighborhood: number;
      neighborhoodName: string;
      numBlocksInNeighborhood: number;
      treesInNeighborhood: number;
      averageTreesInBlock: number;
    }[]
  > {
    return this.treeRepository
      .createQueryBuilder('trees')
      .innerJoin('trees.project', 'project')
      .innerJoin('trees.neighborhood', 'neighborhood')
      .leftJoin('neighborhood.unitWorks', 'uw', 'uw.projectId = :idProject', { idProject })
      .where('project.idProject = :idProject', { idProject })
      .andWhere('uw.idUnitWork IS NULL')
      .select([
        'neighborhood.idNeighborhood AS "idNeighborhood"',
        'neighborhood.numBlocksInNeighborhood AS "numBlocksInNeighborhood"',
        'COUNT(DISTINCT trees.idTree) AS "treesInNeighborhood"',
        'AVG(trees.treesInTheBlock) AS "averageTreesInBlock"',
      ])
      .groupBy('neighborhood.idNeighborhood')
      .getRawMany();
  }

  async countAllInterventionsByNeighborhood(
    idProject: number,
    idNeighborhood: number,
    treesInNeighborhood: number,
    estimatedTotal: number,
  ): Promise<Record<string, number>> {
    const result = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .innerJoin('tree.interventionTrees', 'interventionTree')
      .innerJoin('interventionTree.intervention', 'intervention')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .select('intervention.interventionName', 'interventionName')
      .addSelect('COUNT(*)', 'count')
      .groupBy('intervention.interventionName')
      .getRawMany();

    return Object.fromEntries(result.map((r) => [r.interventionName, Math.round((r.count / treesInNeighborhood) * estimatedTotal)]));
  }

  async getNumBlocksInNeighborhood(idProject: number, idNeighborhood: number): Promise<number | null> {
    const result = await this.treeRepository
      .createQueryBuilder('trees')
      .innerJoin('trees.neighborhood', 'neighborhood')
      .innerJoin('trees.project', 'project')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .select('neighborhood.numBlocksInNeighborhood AS "numBlocksInNeighborhood"')
      .getRawOne();
    return result?.numBlocksInNeighborhood ?? null;
  }

  async getTreesInTheBlockList(idProject: number, idNeighborhood: number): Promise<{ treesInTheBlock: number }[]> {
    return this.treeRepository
      .createQueryBuilder('trees')
      .innerJoin('trees.project', 'project')
      .innerJoin('trees.neighborhood', 'neighborhood')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .andWhere('trees.treesInTheBlock is not null')
      .select(['trees.treesInTheBlock AS "treesInTheBlock"'])
      .getRawMany();
  }

  async getMeanTreesInBlock(idProject: number, idNeighborhood: number): Promise<number | null> {
    const result = await this.treeRepository
      .createQueryBuilder('trees')
      .innerJoin('trees.project', 'project')
      .innerJoin('trees.neighborhood', 'neighborhood')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .select(['AVG(trees.treesInTheBlock) AS "meanOfTreesInTheBlock"'])
      .getRawOne();
    return result?.meanOfTreesInTheBlock ?? null;
  }

  async countTreesInNeighborhood(idProject: number, idNeighborhood: number): Promise<number> {
    const result = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('neighborhood.idNeighborhood = :idNeighborhood', { idNeighborhood })
      .select(['COUNT(*) AS "treesQty"'])
      .groupBy('tree.neighborhood')
      .getRawOne();
    return Math.round(result?.treesQty ?? 0);
  }

  async getSpeciesCountsPerNeighborhood(idProject: number): Promise<{ neighborhoodId: number; species: string; count: number }[]> {
    const rows = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('tree.treeTypeName IS NOT NULL')
      .select(['neighborhood.idNeighborhood AS "neighborhoodId"', 'tree.treeTypeName AS "species"', 'COUNT(*) AS "count"'])
      .groupBy('neighborhood.idNeighborhood')
      .addGroupBy('tree.treeTypeName')
      .orderBy('"count"', 'DESC')
      .getRawMany();
    return rows.map((r) => ({ neighborhoodId: r.neighborhoodId, species: r.species, count: parseInt(r.count, 10) }));
  }

  async getRiskCountsPerNeighborhood(idProject: number): Promise<{ neighborhoodId: number; risk: number; count: number }[]> {
    const rows = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .innerJoin('tree.neighborhood', 'neighborhood')
      .where('project.idProject = :idProject', { idProject })
      .andWhere('tree.risk IS NOT NULL')
      .select(['neighborhood.idNeighborhood AS "neighborhoodId"', 'tree.risk AS "risk"', 'COUNT(*) AS "count"'])
      .groupBy('neighborhood.idNeighborhood')
      .addGroupBy('tree.risk')
      .orderBy('"count"', 'DESC')
      .getRawMany();
    return rows.map((r) => ({ neighborhoodId: r.neighborhoodId, risk: r.risk, count: parseInt(r.count, 10) }));
  }

  async removeTreesByProjectId(idProject: number): Promise<void> {
    const trees = await this.treeRepository
      .createQueryBuilder('tree')
      .innerJoin('tree.project', 'project')
      .where('project.idProject = :idProject', { idProject })
      .select(['tree.idTree AS "idTree"'])
      .getRawMany();
    for (const tree of trees) {
      await this.treeRepository.delete(tree.idTree);
    }
  }
}
