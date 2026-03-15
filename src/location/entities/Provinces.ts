import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Cities } from './Cities';

@Index('provinces_pkey', ['idProvince'], { unique: true })
@Entity('provinces', { schema: 'public' })
export class Provinces {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_province' })
  idProvince: number;

  @Column('character varying', { name: 'province_name', length: 40 })
  provinceName: string;

  @OneToMany(() => Cities, (cities) => cities.province)
  cities: Cities[];
}
