import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DefectTree } from './DefectTree';

@Index('unique_defect_name', ['defectName'], { unique: true })
@Index('defects_pkey', ['idDefect'], { unique: true })
@Entity('defects', { schema: 'public' })
export class Defects {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_defect' })
  idDefect: number;

  @Column('character varying', {
    name: 'defect_name',
    unique: true,
    length: 255,
  })
  defectName: string;

  @Column('enum', { name: 'defect_zone', enum: ['raiz', 'tronco', 'rama'] })
  defectZone: 'raiz' | 'tronco' | 'rama';

  @OneToMany(() => DefectTree, (defectTree) => defectTree.defect)
  defectTrees: DefectTree[];
}
