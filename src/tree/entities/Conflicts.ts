import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ConflictTree } from './ConflictTree';

@Index('unique_conflict_name', ['conflictName'], { unique: true })
@Index('conflicts_pkey', ['idConflict'], { unique: true })
@Entity('conflicts', { schema: 'public' })
export class Conflicts {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_conflict' })
  idConflict: number;

  @Column('character varying', {
    name: 'conflict_name',
    unique: true,
    length: 100,
  })
  conflictName: string;

  @OneToMany(() => ConflictTree, (conflictTree) => conflictTree.conflict)
  conflictTrees: ConflictTree[];
}
