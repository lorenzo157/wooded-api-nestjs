import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Neighborhoods } from '../../unitwork/entities/Neighborhoods';

@Index('coordinates_pkey', ['idCoordinate'], { unique: true })
@Entity('coordinates', { schema: 'public' })
export class Coordinates {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_coordinate' })
  idCoordinate: number;

  @Column('numeric', {
    name: 'longitude',
    nullable: true,
    precision: 12,
    scale: 10,
  })
  longitude: number;

  @Column('numeric', {
    name: 'latitude',
    nullable: true,
    precision: 12,
    scale: 10,
  })
  latitude: number;

  @ManyToOne(() => Neighborhoods)
  @JoinColumn([{ name: 'neighborhood_id', referencedColumnName: 'idNeighborhood' }])
  neighborhood: Neighborhoods;
}
