import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Skill } from '../../skills/infrastructure/skill.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  // ManyToMany: één user kan meerdere skills hebben, één skill kan bij meerdere users horen.
  // @JoinTable() staat altijd op de "owning side" van de relatie — hier dus bij User.
  // TypeORM maakt automatisch een junction tabel 'user_skills' aan met kolommen
  // user_id en skill_id. Er is geen aparte entity of handmatige config nodig.
  @ManyToMany(() => Skill, (skill) => skill.users)
  @JoinTable({ name: 'user_skills' })
  skills: Skill[];
}
