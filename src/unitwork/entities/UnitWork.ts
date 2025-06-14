import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Neighborhoods } from './Neighborhoods';
import { Projects } from '../../project/entities/Projects';

@Index('unit_work_pkey', ['idUnitWork'], { unique: true })
@Index('unique_project_neighborhood', ['neighborhoodId', 'projectId'], {
  unique: true,
})
@Entity('unit_work', { schema: 'public' })
export class UnitWork {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_unit_work' })
  idUnitWork: number;

  @Column('integer', { name: 'project_id', unique: true })
  projectId: number;

  @Column('integer', { name: 'neighborhood_id', unique: true })
  neighborhoodId: number;

  @Column('integer', { name: 'cabling', default: () => '0' })
  cabling: number;

  @Column('integer', { name: 'fastening', default: () => '0' })
  fastening: number;

  @Column('integer', { name: 'propping', default: () => '0' })
  propping: number;

  @Column('integer', {
    name: 'permeable_surface_increases',
    default: () => '0',
  })
  permeableSurfaceIncreases: number;

  @Column('integer', { name: 'fertilizations', default: () => '0' })
  fertilizations: number;

  @Column('integer', { name: 'descompression', default: () => '0' })
  descompression: number;

  @Column('integer', { name: 'drains', default: () => '0' })
  drains: number;

  @Column('integer', { name: 'extractions', default: () => '0' })
  extractions: number;

  @Column('integer', { name: 'plantations', default: () => '0' })
  plantations: number;

  @Column('integer', { name: 'openings_pot', default: () => '0' })
  openingsPot: number;

  @Column('integer', { name: 'advanced_inspections', default: () => '0' })
  advancedInspections: number;

  @Column('integer', { name: 'pruning_training', default: () => '0' })
  pruningTraining: number;

  @Column('integer', { name: 'pruning_sanitary', default: () => '0' })
  pruningSanitary: number;

  @Column('integer', { name: 'pruning_height_reduction', default: () => '0' })
  pruningHeightReduction: number;

  @Column('integer', { name: 'pruning_branch_thinning', default: () => '0' })
  pruningBranchThinning: number;

  @Column('integer', { name: 'pruning_sign_clearing', default: () => '0' })
  pruningSignClearing: number;

  @Column('integer', { name: 'pruning_power_line_clearing', default: () => '0' })
  pruningPowerLineClearing: number;

  @Column('integer', { name: 'pruning_root_deflectors', default: () => '0' })
  pruningRootDeflectors: number;

  @Column('integer', { name: 'move_target', default: () => '0' })
  moveTarget: number;

  @Column('integer', { name: 'restrict_access', default: () => '0' })
  restrictAccess: number;

  @Column('character varying', {
    name: 'campaign_description',
    nullable: true,
    length: 100,
  })
  campaignDescription: string | null;

  @ManyToOne(() => Neighborhoods, (neighborhoods) => neighborhoods.unitWorks)
  @JoinColumn([{ name: 'neighborhood_id', referencedColumnName: 'idNeighborhood' }])
  neighborhood: Neighborhoods;

  @ManyToOne(() => Projects, (project) => project.unitWorks)
  @JoinColumn([{ name: 'project_id', referencedColumnName: 'idProject' }])
  project: Projects;

  @ManyToOne(() => UnitWork, (unitWork) => unitWork.unitWorks, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'unit_work_id', referencedColumnName: 'idUnitWork' }])
  unitWork_2: UnitWork;

  @OneToMany(() => UnitWork, (unitWork) => unitWork.unitWork_2)
  unitWorks: UnitWork[];
}
