import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Skill } from './skill.entity';

// De SkillRepository bevat alle DB-operaties voor skills.
//
// - findOrCreate — zoekt een skill op naam (lowercase), of maakt hem aan als hij
//   niet bestaat. Dit voorkomt duplicaten zoals 'TypeScript' en 'typescript'.
// - findAllWithUserCount — één SQL query met een LEFT JOIN en GROUP BY om het aantal
//   users per skill te tellen. Efficiënter dan voor elke skill apart een query doen.
//
// v2: findOrCreate gebruikt nu een DB-level upsert (INSERT ... ON CONFLICT DO NOTHING)
// in plaats van een aparte SELECT gevolgd door een INSERT.
// Probleem vóór v2 (race condition): twee gelijktijdige POST /users-requests met
// dezelfde nieuwe skill passeerden allebei de findOne-check (beide zagen: niet gevonden),
// gingen allebei naar de save(), en de tweede insert crashte op de UNIQUE constraint van
// de 'name'-kolom in de skills-tabel.
// Nu: PostgreSQL handelt het conflict atomair af op DB-niveau. De tweede INSERT doet
// niets (DO NOTHING) en daarna lezen we de bestaande rij terug via findOne.

@Injectable()
export class SkillRepository {
  constructor(
    @InjectRepository(Skill)
    private readonly repo: Repository<Skill>,
  ) {}

  // v2: queryRunner parameter toegevoegd zodat deze methode binnen de transactie van
  // UsersService.createUser() kan draaien — zelfde connectie als de user-insert.
  async findOrCreate(name: string, queryRunner?: QueryRunner): Promise<Skill> {
    const normalized = name.toLowerCase();
    const manager = queryRunner ? queryRunner.manager : this.repo.manager;

    // v2: INSERT ... ON CONFLICT DO NOTHING — atomaire upsert op DB-niveau.
    // Als de skill al bestaat, doet PostgreSQL niets en blijft de bestaande rij intact.
    // Dit elimineert de race condition waarbij twee requests tegelijk dezelfde
    // nieuwe skill probeerden in te voegen en de tweede op een UNIQUE-fout vastliep.
    await manager
      .createQueryBuilder()
      .insert()
      .into(Skill)
      .values({ name: normalized })
      .orIgnore()
      .execute();

    // Na de upsert lezen we de skill terug — gegarandeerd aanwezig, ongeacht of
    // deze request hem aanmaakte of een andere request hem net vóór ons aanmaakte.
    return manager.findOneOrFail(Skill, { where: { name: normalized } });
  }

  async findAllWithUserCount(): Promise<Array<{ id: string; name: string; userCount: string }>> {
    // JOIN op de ManyToMany inverse kant ('skill.users') — TypeORM gebruikt
    // automatisch de junction tabel 'user_skills'. COUNT telt het aantal users per skill.
    return this.repo
      .createQueryBuilder('skill')
      .select('skill.id', 'id')
      .addSelect('skill.name', 'name')
      .addSelect('COUNT(user.id)', 'userCount')
      .leftJoin('skill.users', 'user')
      .groupBy('skill.id')
      .getRawMany();
  }
}
