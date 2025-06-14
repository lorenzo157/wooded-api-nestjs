import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RolePermission } from './RolePermission';
import { Users } from './Users';

@Index('roles_pkey', ['idRole'], { unique: true })
@Index('unique_role_name', ['roleName'], { unique: true })
@Entity('roles', { schema: 'public' })
export class Roles {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_role' })
  idRole: number;

  @Column('character varying', {
    name: 'role_name',
    unique: true,
    length: 40,
  })
  roleName: string;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];

  @OneToMany(() => Users, (users) => users.role)
  users: Users[];
}
