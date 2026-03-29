import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './skill.entity';

// De SkillRepository bevat alle DB-operaties voor skills.
//
// - findOrCreate — zoekt een skill op naam (lowercase), of maakt hem aan als hij
//   niet bestaat. Dit voorkomt duplicaten zoals 'TypeScript' en 'typescript'.
// - findAllWithUserCount — één SQL query met een LEFT JOIN en GROUP BY om het aantal
//   users per skill te tellen. Efficiënter dan voor elke skill apart een query doen.

@Injectable()
export class SkillRepository {
  constructor(
    @InjectRepository(Skill)
    private readonly repo: Repository<Skill>,
  ) {}

  async findOrCreate(name: string): Promise<Skill> {
    const normalized = name.toLowerCase();
    const existing = await this.repo.findOne({ where: { name: normalized } });
    if (existing) return existing;
    return this.repo.save(this.repo.create({ name: normalized }));
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
