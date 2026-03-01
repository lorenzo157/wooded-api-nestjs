import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Neighborhoods } from '../../unitwork/entities/Neighborhoods';

@Index('coordinates_pkey', ['idCoordinate'], { unique: true })
@Entity('coordinates', { schema: 'public' })
export class Coordinates {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_coordinate' })
  idCoordinate: number;

  @Column('double precision', {
    name: 'longitude',
    nullable: true,
  })
  longitude: number;

  @Column('double precision', {
    name: 'latitude',
    nullable: true,
  })
  latitude: number;

  @ManyToOne(() => Neighborhoods)
  @JoinColumn([{ name: 'neighborhood_id', referencedColumnName: 'idNeighborhood' }])
  neighborhood: Neighborhoods;
}
