import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Permissions } from './Permissions';
import { Roles } from './Roles';

@Index('role_permission_pkey', ['idRolePermission'], { unique: true })
@Index('unique_role_permission', ['permissionId', 'roleId'], { unique: true })
@Entity('role_permission', { schema: 'public' })
export class RolePermission {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_role_permission' })
  idRolePermission: number;

  @Column('integer', { name: 'permission_id', unique: true })
  permissionId: number;

  @Column('integer', { name: 'role_id', unique: true })
  roleId: number;

  @ManyToOne(() => Permissions, (permissions) => permissions.rolePermissions)
  @JoinColumn([{ name: 'permission_id', referencedColumnName: 'idPermission' }])
  permission: Permissions;

  @ManyToOne(() => Roles, (roles) => roles.rolePermissions)
  @JoinColumn([{ name: 'role_id', referencedColumnName: 'idRole' }])
  role: Roles;
}
