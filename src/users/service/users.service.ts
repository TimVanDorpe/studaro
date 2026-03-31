import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly skillRepo: SkillRepository,
    private readonly matchingService: MatchingService,
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

    const user = await this.userRepo.create(dto.name, dto.email);

    // Voor elke skill: zoek of maak aan, en koppel via de ManyToMany junction tabel.
    for (const skillName of dto.skills) {
      const skill = await this.skillRepo.findOrCreate(skillName);
      await this.userRepo.addSkill(user.id, skill.id);
    }

    // Laad de user opnieuw inclusief zijn skills via de ManyToMany-relatie.
    const userWithSkills = await this.userRepo.findByIdWithSkills(user.id);
    return ResponseUserDto.fromEntity(userWithSkills!, userWithSkills!.skills);
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
