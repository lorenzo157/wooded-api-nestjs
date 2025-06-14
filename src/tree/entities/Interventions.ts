import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InterventionTree } from './InterventionTree';

@Index('interventions_pkey', ['idIntervention'], { unique: true })
@Index('unique_intervention_name', ['interventionName'], { unique: true })
@Entity('interventions', { schema: 'public' })
export class Interventions {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_intervention' })
  idIntervention: number;

  @Column('character varying', {
    name: 'intervention_name',
    unique: true,
    length: 100,
  })
  interventionName: string;

  @OneToMany(() => InterventionTree, (interventionTree) => interventionTree.intervention)
  interventionTrees: InterventionTree[];
}
