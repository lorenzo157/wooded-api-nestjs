import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RolePermission } from './RolePermission';

@Index('permissions_pkey', ['idPermission'], { unique: true })
@Index('unique_permission_name', ['permissionName'], { unique: true })
@Entity('permissions', { schema: 'public' })
export class Permissions {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_permission' })
  idPermission: number;

  @Column('character varying', {
    name: 'permission_name',
    unique: true,
    length: 40,
  })
  permissionName: string;

  @Column('character varying', {
    name: 'permission_description',
    nullable: true,
    length: 255,
  })
  permissionDescription: string | null;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions: RolePermission[];
}
