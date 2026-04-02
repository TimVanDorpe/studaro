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

  // ManyToMany: one user can have multiple skills, one skill can belong to multiple users.
  // @JoinTable() always goes on the "owning side" of the relation — here on User.
  // TypeORM automatically creates a junction table 'user_skills' with columns
  // user_id and skill_id. No separate entity or manual config is needed.
  @ManyToMany(() => Skill, (skill) => skill.users)
  @JoinTable({ name: 'user_skills' })
  skills: Skill[];
}
