import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProjectUser } from './ProjectUser';
import { Cities } from '../../shared/entities/Cities';
import { Users } from '../../user/entities/Users';
import { Trees } from '../../tree/entities/Trees';
import { UnitWork } from '../../unitwork/entities/UnitWork';

@Index('project_pkey', ['idProject'], { unique: true })
@Entity('projects', { schema: 'public' })
export class Projects {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id_project' })
  idProject: number;

  @Column('character varying', { name: 'project_name', length: 255 })
  projectName: string;

  @Column('text', {
    name: 'project_description',
    nullable: true,
  })
  projectDescription: string | null;

  @Column('date', { name: 'start_date' })
  startDate: string;

  @Column('date', { name: 'end_date', nullable: true })
  endDate: string | null;

  @Column('character varying', { name: 'project_type', length: 255 })
  projectType: string;

  @OneToMany(() => ProjectUser, (projectUser) => projectUser.project)
  projectUsers: ProjectUser[];

  @ManyToOne(() => Cities, (cities) => cities.projects)
  @JoinColumn([{ name: 'city_id', referencedColumnName: 'idCity' }])
  city: Cities;

  @ManyToOne(() => Users, (user) => user.projects)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'idUser' }])
  user: Users;

  @OneToMany(() => Trees, (tree) => tree.project)
  trees: Trees[];

  @OneToMany(() => UnitWork, (unitWork) => unitWork.project)
  unitWorks: UnitWork[];
}
