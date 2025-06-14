import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Diseases } from './Diseases';
import { Trees } from './Trees';

@Index('unique_tree_disease', ['diseaseId', 'treeId'], { unique: true })
@Index('disease_tree_pkey', ['idDiseaseTree'], { unique: true })
@Entity('disease_tree', { schema: 'public' })
export class DiseaseTree {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_disease_tree' })
  idDiseaseTree: number;

  @Column('integer', { name: 'tree_id', unique: true })
  treeId: number;

  @Column('integer', { name: 'disease_id', unique: true })
  diseaseId: number;

  @ManyToOne(() => Diseases, (diseases) => diseases.diseaseTrees)
  @JoinColumn([{ name: 'disease_id', referencedColumnName: 'idDisease' }])
  disease: Diseases;

  @ManyToOne(() => Trees, (tree) => tree.diseaseTrees, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tree_id', referencedColumnName: 'idTree' }])
  tree: Trees;
}
