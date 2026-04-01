import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
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
//
// v2: create() en addSkill() accepteren een optionele QueryRunner.
// Als een QueryRunner meegegeven wordt, voert de methode zijn query uit binnen
// de actieve transactie van die runner. Zonder QueryRunner werkt alles zoals vóór v2
// (auto-commit, los van enige transactie).

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

  // v2: queryRunner parameter toegevoegd. Als meegegeven, gebruikt deze methode de
  // manager van de actieve transactie zodat de INSERT onderdeel wordt van die transactie.
  async create(name: string, email: string, queryRunner?: QueryRunner): Promise<User> {
    const manager = queryRunner ? queryRunner.manager : this.repo.manager;
    return manager.save(User, manager.create(User, { name, email }));
  }

  // v2: queryRunner parameter toegevoegd. De relation-query wordt uitgevoerd via de
  // manager van de actieve transactie — dezelfde connectie als create() hierboven.
  // Voegt een skill toe aan de ManyToMany-junction tabel zonder de volledige
  // user entity te laden. TypeORM vertaalt dit naar een INSERT in 'user_skills'.
  async addSkill(userId: string, skillId: string, queryRunner?: QueryRunner): Promise<void> {
    const manager = queryRunner ? queryRunner.manager : this.repo.manager;
    await manager
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
