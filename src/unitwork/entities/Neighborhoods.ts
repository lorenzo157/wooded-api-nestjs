import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Cities } from '../../shared/entities/Cities';
import { Trees } from '../../tree/entities/Trees';
import { UnitWork } from './UnitWork';
import { Coordinates } from '../../shared/entities/Coordinates';

@Index('neighborhoods_pkey', ['idNeighborhood'], { unique: true })
@Entity('neighborhoods', { schema: 'public' })
export class Neighborhoods {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_neighborhood' })
  idNeighborhood: number;

  @Column('character varying', { name: 'neighborhood_name', length: 40 })
  neighborhoodName: string;

  @Column('integer', { name: 'num_blocks_in_neighborhood' })
  numBlocksInNeighborhood: number;

  @ManyToOne(() => Cities, (cities) => cities.neighborhoods)
  @JoinColumn([{ name: 'city_id', referencedColumnName: 'idCity' }])
  city: Cities;

  @OneToMany(() => Trees, (trees) => trees.neighborhood)
  trees: Trees[];

  @OneToMany(() => UnitWork, (unitWork) => unitWork.neighborhood)
  unitWorks: UnitWork[];

  @OneToMany(() => Coordinates, (Coordinates) => Coordinates.neighborhood)
  coordinates: Coordinates[];
}
