import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/infrastructure/user.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  // Inverse side of the ManyToMany relation — no @JoinTable() here,
  // because the owning side (and thus the junction table) is managed by User.
  @ManyToMany(() => User, (user) => user.skills)
  users: User[];
}
