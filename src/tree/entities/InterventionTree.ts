import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Interventions } from './Interventions';
import { Trees } from './Trees';

@Index('intervention_tree_pkey', ['idInterventionTree'], { unique: true })
@Index('unique_tree_intervention', ['interventionId', 'treeId'], {
  unique: true,
})
@Entity('intervention_tree', { schema: 'public' })
export class InterventionTree {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_intervention_tree' })
  idInterventionTree: number;

  @Column('integer', { name: 'tree_id', unique: true })
  treeId: number;

  @Column('integer', { name: 'intervention_id', unique: true })
  interventionId: number;

  @ManyToOne(() => Interventions, (interventions) => interventions.interventionTrees)
  @JoinColumn([{ name: 'intervention_id', referencedColumnName: 'idIntervention' }])
  intervention: Interventions;

  @ManyToOne(() => Trees, (tree) => tree.interventionTrees, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tree_id', referencedColumnName: 'idTree' }])
  tree: Trees;
}
