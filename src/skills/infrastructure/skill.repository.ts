import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Skill } from './skill.entity';

// SkillRepository contains all DB operations for skills.
//
// - findOrCreate — looks up a skill by name (lowercase), or creates it if it
//   does not exist. This prevents duplicates such as 'TypeScript' and 'typescript'.
// - findAllWithUserCount — one SQL query with a LEFT JOIN and GROUP BY to count the number
//   of users per skill. More efficient than running a separate query for each skill.
//
// v2: findOrCreate uses a DB-level upsert (INSERT ... ON CONFLICT DO NOTHING)
// instead of a separate SELECT followed by an INSERT.
// Problem before v2 (race condition): two concurrent POST /users requests with
// the same new skill both passed the findOne check (both saw: not found),
// both proceeded to save(), and the second insert crashed on the UNIQUE constraint of
// the 'name' column in the skills table.
// Now: PostgreSQL handles the conflict atomically at the DB level. The second INSERT does
// nothing (DO NOTHING) and we then read the existing row back via findOne.
// findOrCreate requires a QueryRunner to run within the same transaction as the caller.

@Injectable()
export class SkillRepository {
  constructor(
    @InjectRepository(Skill)
    private readonly repo: Repository<Skill>,
  ) {}

  async findOrCreate(name: string, queryRunner: QueryRunner): Promise<Skill> {
    const normalized = name.toLowerCase();
    const manager = queryRunner.manager;

    // v2: INSERT ... ON CONFLICT DO NOTHING — atomic upsert at the DB level.
    // If the skill already exists, PostgreSQL does nothing and the existing row remains intact.
    // This eliminates the race condition where two requests simultaneously tried to insert
    // the same new skill and the second one failed with a UNIQUE error.
    await manager
      .createQueryBuilder()
      .insert()
      .into(Skill)
      .values({ name: normalized })
      .orIgnore()
      .execute();

    // After the upsert we read the skill back — guaranteed to exist, regardless of whether
    // this request created it or another request created it just before us.
    return manager.findOneOrFail(Skill, { where: { name: normalized } });
  }

  async findAllWithUserCount(): Promise<Array<{ id: string; name: string; userCount: string }>> {
    // Direct JOIN on the junction table 'user_skills' — avoids the extra JOIN to the users table
    // since we only need a COUNT of rows, not any user columns.
      // SELECT skill.id AS id, skill.name AS name, COUNT(us.user_id) AS "userCount"
      // FROM skills skill
      // LEFT JOIN user_skills us ON us.skill_id = skill.id
      // GROUP BY skill.id
    return this.repo
      .createQueryBuilder('skill')
      .select('skill.id', 'id')
      .addSelect('skill.name', 'name')
      .addSelect('COUNT(us.user_id)', 'userCount')
      .leftJoin('user_skills', 'us', 'us.skill_id = skill.id')
      .groupBy('skill.id')
      .getRawMany();
  }
}
