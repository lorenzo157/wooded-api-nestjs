import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PestTree } from './PestTree';

@Index('pests_pkey', ['idPest'], { unique: true })
@Index('unique_pest_name', ['pestName'], { unique: true })
@Entity('pests', { schema: 'public' })
export class Pests {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_pest' })
  idPest: number;

  @Column('character varying', {
    name: 'pest_name',
    unique: true,
    length: 100,
  })
  pestName: string;

  @OneToMany(() => PestTree, (pestTree) => pestTree.pest)
  pestTrees: PestTree[];
}
