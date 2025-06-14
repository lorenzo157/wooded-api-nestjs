import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ConflictTree } from './ConflictTree';
import { DefectTree } from './DefectTree';
import { DiseaseTree } from './DiseaseTree';
import { InterventionTree } from './InterventionTree';
import { PestTree } from './PestTree';
import { Coordinates } from '../../shared/entities/Coordinates';
import { Neighborhoods } from '../../unitwork/entities/Neighborhoods';
import { Projects } from '../../project/entities/Projects';

@Index('tree_pkey', ['idTree'], { unique: true })
@Entity('trees', { schema: 'public' })
export class Trees {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_tree' })
  idTree: number;

  @Column('timestamp without time zone', {
    name: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  datetime: Date;

  @Column('character varying', {
    name: 'photo_file_name',
    nullable: true,
    length: 255,
  })
  photoFileName: string | null;

  @Column('integer', { name: 'city_block' })
  cityBlock: number;

  @Column('numeric', { name: 'perimeter', nullable: true, precision: 7, scale: 5 })
  perimeter: number | null;

  @Column('numeric', { name: 'height', nullable: true, precision: 8, scale: 5 })
  height: number | null;

  @Column('numeric', { name: 'incline', nullable: true, precision: 8, scale: 5 })
  incline: number | null;

  @Column('smallint', { name: 'trees_in_the_block', nullable: true })
  treesInTheBlock: number | null;

  @Column('character varying', {
    name: 'use_under_the_tree',
    nullable: true,
    length: 100,
  })
  useUnderTheTree: string | null;

  @Column('smallint', { name: 'frequency_use', nullable: true })
  frequencyUse: number | null;

  @Column('smallint', { name: 'potential_damage', nullable: true })
  potentialDamage: number | null;

  @Column('boolean', { name: 'is_movable', nullable: true })
  isMovable: boolean | null;

  @Column('boolean', { name: 'is_restrictable', nullable: true })
  isRestrictable: boolean | null;

  @Column('boolean', { name: 'is_missing', nullable: true })
  isMissing: boolean | null;

  @Column('boolean', { name: 'is_dead', nullable: true })
  isDead: boolean | null;

  @Column('boolean', { name: 'exposed_roots', nullable: true })
  exposedRoots: boolean | null;

  @Column('numeric', { name: 'dch', nullable: true, precision: 7, scale: 5 })
  dch: number | null;

  @Column('enum', {
    name: 'wind_exposure',
    nullable: true,
    enum: ['expuesto', 'parcialmente expuesto', 'protegido', 'tunel de viento'],
  })
  windExposure: 'expuesto' | 'parcialmente expuesto' | 'protegido' | 'tunel de viento' | null;

  @Column('enum', {
    name: 'vigor',
    nullable: true,
    enum: ['excelente', 'normal', 'pobre'],
  })
  vigor: 'excelente' | 'normal' | 'pobre' | null;

  @Column('enum', {
    name: 'canopy_density',
    nullable: true,
    enum: ['escasa', 'normal', 'densa'],
  })
  canopyDensity: 'escasa' | 'normal' | 'densa' | null;

  @Column('enum', {
    name: 'growth_space',
    nullable: true,
    enum: ['sin cazuela', 'cazuela = 1 - 2 m2', 'cazuela > 2 m2', 'vereda jardin'],
  })
  growthSpace: 'sin cazuela' | 'cazuela = 1 - 2 m2' | 'cazuela > 2 m2' | 'vereda jardin' | null;

  @Column('enum', {
    name: 'tree_value',
    nullable: true,
    enum: ['historico', 'monumental', 'singular', 'notable', 'plaza/parque (ornamental)', 'reclamo'],
  })
  treeValue: 'historico' | 'monumental' | 'singular' | 'notable' | 'plaza/parque (ornamental)' | 'reclamo' | null;

  @Column('enum', {
    name: 'street_materiality',
    nullable: true,
    enum: ['tierra', 'mejorado petroleo', 'asfalto', 'concreto', 'cordon cuneta'],
  })
  streetMateriality: 'tierra' | 'mejorado petroleo' | 'asfalto' | 'concreto' | 'cordon cuneta' | null;

  @Column('smallint', { name: 'risk', nullable: true })
  risk: number | null;

  @Column('character varying', {
    name: 'address',
    length: 100,
  })
  address: string;

  @Column('character varying', { name: 'tree_type_name', length: 80 })
  treeTypeName: string;

  @Column('character varying', { name: 'gender', nullable: true, length: 80 })
  gender: string | null;

  @Column('character varying', {
    name: 'species',
    nullable: true,
    length: 80,
  })
  species: string | null;

  @Column('character varying', {
    name: 'scientific_name',
    nullable: true,
    length: 80,
  })
  scientificName: string | null;

  @OneToMany(() => ConflictTree, (conflictTree) => conflictTree.tree)
  conflictTrees: ConflictTree[];

  @OneToMany(() => DefectTree, (defectTree) => defectTree.tree)
  defectTrees: DefectTree[];

  @OneToMany(() => DiseaseTree, (diseaseTree) => diseaseTree.tree)
  diseaseTrees: DiseaseTree[];

  @OneToMany(() => InterventionTree, (interventionTree) => interventionTree.tree)
  interventionTrees: InterventionTree[];

  @OneToMany(() => PestTree, (pestTree) => pestTree.tree)
  pestTrees: PestTree[];

  @OneToOne(() => Coordinates)
  @JoinColumn([{ name: 'coordinate_id', referencedColumnName: 'idCoordinate' }])
  coordinate: Coordinates;

  @ManyToOne(() => Neighborhoods, (neighborhoods) => neighborhoods.trees)
  @JoinColumn([{ name: 'neighborhood_id', referencedColumnName: 'idNeighborhood' }])
  neighborhood: Neighborhoods;

  @ManyToOne(() => Projects, (projects) => projects.trees)
  @JoinColumn([{ name: 'project_id', referencedColumnName: 'idProject' }])
  project: Projects;
}
