import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Defects } from './Defects';
import { Trees } from './Trees';

@Index('unique_tree_defect', ['defectId', 'treeId'], { unique: true })
@Index('defect_tree_pkey', ['idDefectTree'], { unique: true })
@Entity('defect_tree', { schema: 'public' })
export class DefectTree {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_defect_tree' })
  idDefectTree: number;

  @Column('integer', { name: 'tree_id', unique: true })
  treeId: number;

  @Column('integer', { name: 'defect_id', unique: true })
  defectId: number;

  @Column('smallint', { name: 'defect_value' })
  defectValue: number;

  @Column('character varying', { name: 'text_defect_value', length: 100 })
  textDefectValue: string;

  @Column('smallint', { name: 'branches', nullable: true })
  branches: number | null;

  @ManyToOne(() => Defects, (defects) => defects.defectTrees)
  @JoinColumn([{ name: 'defect_id', referencedColumnName: 'idDefect' }])
  defect: Defects;

  @ManyToOne(() => Trees, (tree) => tree.defectTrees, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tree_id', referencedColumnName: 'idTree' }])
  tree: Trees;
}
