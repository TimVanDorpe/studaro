import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

// De UserRepository bevat alle DB-operaties voor users.
//
// - findByIdWithSkills — haalt een user op inclusief al zijn skills in één query
//   via leftJoinAndSelect op de ManyToMany-relatie. Zonder join zou je N+1 queries
//   krijgen (één voor de user, dan één per skill).
// - findAllWithSkillsExcluding — haalt alle andere users op met hun skills,
//   ook in één query. Dit is de basis voor de matching.
// - addSkill — voegt een skill toe aan de junction tabel via de TypeORM relation API,
//   zonder de volledige user te hoeven laden.

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async create(name: string, email: string): Promise<User> {
    return this.repo.save(this.repo.create({ name, email }));
  }

  // Voegt een skill toe aan de ManyToMany-junction tabel zonder de volledige
  // user entity te laden. TypeORM vertaalt dit naar een INSERT in 'user_skills'.
  async addSkill(userId: string, skillId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .relation(User, 'skills')
      .of(userId)
      .add(skillId);
  }

  async findByIdWithSkills(id: string): Promise<User | null> {
    // leftJoinAndSelect laadt de skills in dezelfde query via de junction tabel —
    // TypeORM genereert automatisch de JOIN op 'user_skills'.
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
