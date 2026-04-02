import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRepository } from '../infrastructure/user.repository';
import { SkillRepository } from '../../skills/infrastructure/skill.repository';
import { MatchingService } from './matching.service';
import { CreateUserDto } from '../model/create-user.dto';
import { ResponseUserDto } from '../model/response-user.dto';
import { ResponseMatchDto } from '../model/response-match.dto';

// UsersService orchestrates the two main use cases:
//
// - createUser: checks for duplicate email → creates user
//   → links skills via ManyToMany (reuses existing skills via findOrCreate)
//   → returns clean DTO
//
// - getMatches: fetches target user → fetches all other users
//   → computes Jaccard scores → returns sorted matches
//
// v2: DataSource injected so createUser can use a QueryRunner transaction.
// All DB writes (create user + link skills) now happen within one atomic operation.

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly skillRepo: SkillRepository,
    private readonly matchingService: MatchingService,
    // v2: DataSource provides access to QueryRunner for manual transaction management.
    // NestJS injects this automatically via the TypeOrmModule configured in AppModule.
    private readonly dataSource: DataSource,
  ) {}

  async getAllUsers(): Promise<ResponseUserDto[]> {
    this.logger.log('Fetching all users');
    const users = await this.userRepo.findAll();
    return users.map((u) => ResponseUserDto.fromEntity(u, u.skills));
  }

  async createUser(dto: CreateUserDto): Promise<ResponseUserDto> {
    this.logger.log(`Creating user ${dto.name} (${dto.email})`);
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        `User with email ${dto.email} already exists`,
      );
    }

    // v2: QueryRunner wraps the entire createUser flow in one DB transaction.
    // Problem before v2: user was created, then skills were linked one by one without
    // rollback. If a crash occurred mid-loop, a zombie user remained in the DB
    // with only a subset of its skills — inconsistent data.
    // Now: if anything fails after queryRunner.startTransaction(), queryRunner.rollbackTransaction()
    // rolls everything back. Only on successful completion is commitTransaction() called.
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.userRepo.create(dto.name, dto.email, queryRunner);

      for (const skillName of dto.skills) {
        const skill = await this.skillRepo.findOrCreate(skillName, queryRunner);
        await this.userRepo.addSkill(user.id, skill.id, queryRunner);
      }

      // v2: only after all writes is the transaction committed to the DB.
      await queryRunner.commitTransaction();

      const userWithSkills = await this.userRepo.findByIdWithSkills(user.id);
      this.logger.log(`User created: ${user.id}`);
      return ResponseUserDto.fromEntity(
        userWithSkills!,
        userWithSkills!.skills,
      );
    } catch (err) {
      // v2: on any error (DB constraint, network, etc.) all writes are rolled back.
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // v2: always release the queryRunner, even on errors — otherwise the DB connection leaks.
      await queryRunner.release();
    }
  }

  async getMatches(userId: string): Promise<ResponseMatchDto[]> {
    this.logger.log(`Computing matches for user ${userId}`);
    const target = await this.userRepo.findByIdWithSkills(userId);
    if (!target) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const others = await this.userRepo.findAllWithSkillsExcluding(userId);
    const matches = this.matchingService.computeMatches(target, others);

    return matches.map((m) => ResponseMatchDto.from(m.user, m.skills, m.score));
  }
}
