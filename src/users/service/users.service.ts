import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRepository } from '../infrastructure/user.repository';
import { SkillRepository } from '../../skills/infrastructure/skill.repository';
import { MatchingService } from './matching.service';
import { CreateUserDto } from '../model/create-user.dto';
import { ResponseUserDto } from '../model/response-user.dto';
import { ResponseMatchDto } from '../model/response-match.dto';

// De UsersService orkestreert de twee hoofd-use-cases:
//
// - createUser: controleert op duplicaat email → maakt user aan
//   → koppelt skills via ManyToMany (hergebruikt bestaande skills via findOrCreate)
//   → geeft clean DTO terug
//
// - getMatches: haalt target user op → haalt alle andere users op
//   → berekent Jaccard scores → geeft gesorteerde matches terug
//
// v2: DataSource geïnjecteerd zodat createUser een QueryRunner-transactie kan gebruiken.
// Alle DB-writes (user aanmaken + skills koppelen) vallen nu binnen één atomaire operatie.

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly skillRepo: SkillRepository,
    private readonly matchingService: MatchingService,
    // v2: DataSource geeft toegang tot QueryRunner voor handmatige transactiebeheer.
    // NestJS injecteert dit automatisch via de TypeOrmModule die in AppModule geconfigureerd is.
    private readonly dataSource: DataSource,
  ) {}

  async getAllUsers(): Promise<ResponseUserDto[]> {
    const users = await this.userRepo.findAll();
    return users.map((u) => ResponseUserDto.fromEntity(u, u.skills));
  }

  async createUser(dto: CreateUserDto): Promise<ResponseUserDto> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(`User with email ${dto.email} already exists`);
    }

    // v2: QueryRunner omhult de volledige createUser-flow in één DB-transactie.
    // Probleem vóór v2: user werd aangemaakt, daarna skills één-voor-één gekoppeld zonder
    // rollback. Bij een crash halverwege de loop bleef een zombie-user achter in de DB
    // met slechts een deel van zijn skills — inconsistente data.
    // Nu: als iets mislukt na queryRunner.startTransaction(), rolt queryRunner.rollbackTransaction()
    // alles terug. Alleen bij succesvolle afronding wordt commitTransaction() aangeroepen.
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.userRepo.create(dto.name, dto.email, queryRunner);

      // Voor elke skill: zoek of maak aan, en koppel via de ManyToMany junction tabel.
      for (const skillName of dto.skills) {
        const skill = await this.skillRepo.findOrCreate(skillName, queryRunner);
        await this.userRepo.addSkill(user.id, skill.id, queryRunner);
      }

      // v2: pas na alle writes wordt de transactie gecommit naar de DB.
      await queryRunner.commitTransaction();

      // Laad de user opnieuw inclusief zijn skills via de ManyToMany-relatie.
      const userWithSkills = await this.userRepo.findByIdWithSkills(user.id);
      return ResponseUserDto.fromEntity(userWithSkills!, userWithSkills!.skills);
    } catch (err) {
      // v2: bij elke fout (DB-constraint, netwerk, etc.) worden alle writes teruggedraaid.
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // v2: queryRunner altijd vrijgeven, ook bij fouten — anders lekt de DB-connectie.
      await queryRunner.release();
    }
  }

  async getMatches(userId: string): Promise<ResponseMatchDto[]> {
    const target = await this.userRepo.findByIdWithSkills(userId);
    if (!target) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const others = await this.userRepo.findAllWithSkillsExcluding(userId);
    const matches = this.matchingService.computeMatches(target, others);

    return matches.map((m) => ResponseMatchDto.from(m.user, m.skills, m.score));
  }
}
