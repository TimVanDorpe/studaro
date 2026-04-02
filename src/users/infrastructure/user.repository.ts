import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { User } from './user.entity';

// UserRepository contains all DB operations for users.
//
// - findByIdWithSkills — fetches a user including all their skills in one query
//   via leftJoinAndSelect on the ManyToMany relation. Without the join you would get N+1 queries
//   (one for the user, then one per skill).
// - findAllWithSkillsExcluding — fetches all other users with their skills,
//   also in one query. This is the basis for matching.
// - addSkill — adds a skill to the junction table via the TypeORM relation API,
//   without needing to load the full user entity.
//
// v2: create() and addSkill() require a QueryRunner so both execute within
// the same transaction as the caller (UsersService.createUser).

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.skills', 'skill')
      .getMany();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async create(name: string, email: string, queryRunner: QueryRunner): Promise<User> {
    const manager = queryRunner.manager;
    return manager.save(User, manager.create(User, { name, email }));
  }

  // Adds a skill to the ManyToMany junction table without loading the full
  // user entity. TypeORM translates this into an INSERT into 'user_skills'.
  async addSkill(userId: string, skillId: string, queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;
    await manager
      .createQueryBuilder()
      .relation(User, 'skills')
      .of(userId)
      .add(skillId);
  }

  async findByIdWithSkills(id: string): Promise<User | null> {
    // leftJoinAndSelect loads skills in the same query via the junction table —
    // TypeORM automatically generates the JOIN on 'user_skills'.
    return this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.skills', 'skill')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findAllWithSkillsExcluding(excludeId: string): Promise<User[]> {
    return this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.skills', 'skill')
      .where('user.id != :id', { id: excludeId })
      .getMany();
  }
}
