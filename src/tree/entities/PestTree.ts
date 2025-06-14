import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Pests } from './Pests';
import { Trees } from './Trees';

@Index('pest_tree_pkey', ['idPestTree'], { unique: true })
@Index('unique_tree_pest', ['pestId', 'treeId'], { unique: true })
@Entity('pest_tree', { schema: 'public' })
export class PestTree {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_pest_tree' })
  idPestTree: number;

  @Column('integer', { name: 'tree_id', unique: true })
  treeId: number;

  @Column('integer', { name: 'pest_id', unique: true })
  pestId: number;

  @ManyToOne(() => Pests, (pests) => pests.pestTrees)
  @JoinColumn([{ name: 'pest_id', referencedColumnName: 'idPest' }])
  pest: Pests;

  @ManyToOne(() => Trees, (tree) => tree.pestTrees, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tree_id', referencedColumnName: 'idTree' }])
  tree: Trees;
}
