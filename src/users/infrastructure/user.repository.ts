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
// v2: create() and addSkill() accept an optional QueryRunner.
// When a QueryRunner is provided, the method executes its query within
// the active transaction of that runner. Without a QueryRunner everything works as before v2
// (auto-commit, independent of any transaction).

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

  // v2: queryRunner parameter added. When provided, this method uses the
  // manager of the active transaction so the INSERT becomes part of that transaction.
  async create(name: string, email: string, queryRunner?: QueryRunner): Promise<User> {
    const manager = queryRunner ? queryRunner.manager : this.repo.manager;
    return manager.save(User, manager.create(User, { name, email }));
  }

  // v2: queryRunner parameter added. The relation query is executed via the
  // manager of the active transaction — the same connection as create() above.
  // Adds a skill to the ManyToMany junction table without loading the full
  // user entity. TypeORM translates this into an INSERT into 'user_skills'.
  async addSkill(userId: string, skillId: string, queryRunner?: QueryRunner): Promise<void> {
    const manager = queryRunner ? queryRunner.manager : this.repo.manager;
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
