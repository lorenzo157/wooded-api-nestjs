import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DiseaseTree } from './DiseaseTree';

@Index('unique_disease_name', ['diseaseName'], { unique: true })
@Index('diseases_pkey', ['idDisease'], { unique: true })
@Entity('diseases', { schema: 'public' })
export class Diseases {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_disease' })
  idDisease: number;

  @Column('character varying', {
    name: 'disease_name',
    unique: true,
    length: 100,
  })
  diseaseName: string;

  @OneToMany(() => DiseaseTree, (diseaseTree) => diseaseTree.disease)
  diseaseTrees: DiseaseTree[];
}
