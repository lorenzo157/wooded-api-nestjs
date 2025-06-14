import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Conflicts } from './Conflicts';
import { Trees } from './Trees';

@Index('unique_tree_conflict', ['conflictId', 'treeId'], { unique: true })
@Index('conflict_tree_pkey', ['idConflictTree'], { unique: true })
@Entity('conflict_tree', { schema: 'public' })
export class ConflictTree {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_conflict_tree' })
  idConflictTree: number;

  @Column('integer', { name: 'tree_id', unique: true })
  treeId: number;

  @Column('integer', { name: 'conflict_id', unique: true })
  conflictId: number;

  @ManyToOne(() => Conflicts, (conflicts) => conflicts.conflictTrees)
  @JoinColumn([{ name: 'conflict_id', referencedColumnName: 'idConflict' }])
  conflict: Conflicts;

  @ManyToOne(() => Trees, (tree) => tree.conflictTrees, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tree_id', referencedColumnName: 'idTree' }])
  tree: Trees;
}
