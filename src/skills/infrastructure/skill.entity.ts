import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/infrastructure/user.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  // Inverse kant van de ManyToMany-relatie — geen @JoinTable() hier,
  // want de owning side (en dus de junction tabel) wordt beheerd door User.
  @ManyToMany(() => User, (user) => user.skills)
  users: User[];
}
