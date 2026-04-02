import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersService } from './users.service';
import { UserRepository } from '../infrastructure/user.repository';
import { SkillRepository } from '../../skills/infrastructure/skill.repository';
import { MatchingService } from './matching.service';
import { User } from '../infrastructure/user.entity';
import { Skill } from '../../skills/infrastructure/skill.entity';

// The most comprehensive test suite. We test 6 scenarios without any DB connection — everything
// mocked with jest.fn(). This is the power of the layered architecture: you can isolate business logic
// and test it quickly.

function makeSkill(id: string, name: string): Skill {
  const s = new Skill();
  s.id = id;
  s.name = name;
  return s;
}

function makeUser(id: string, email: string, skillIds: string[]): User {
  const u = new User();
  u.id = id;
  u.name = 'Test';
  u.email = email;
  u.createdAt = new Date();
  u.skills = skillIds.map((sid) => makeSkill(sid, sid));
  return u;
}

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: Record<string, jest.Mock>;
  let skillRepo: Record<string, jest.Mock>;
  let matchingService: { computeMatches: jest.Mock };

  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  };

  const dataSource = {
    createQueryRunner: jest.fn().mockReturnValue(queryRunner),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    userRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      addSkill: jest.fn(),
      findByIdWithSkills: jest.fn(),
      findAllWithSkillsExcluding: jest.fn(),
    };
    skillRepo = { findOrCreate: jest.fn() };
    matchingService = { computeMatches: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserRepository, useValue: userRepo },
        { provide: SkillRepository, useValue: skillRepo },
        { provide: MatchingService, useValue: matchingService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('createUser', () => {
    it('creates user and associates skill', async () => {
      const skill = makeSkill('s1', 'typescript');
      const user = makeUser('u1', 'alice@test.com', ['s1']);

      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.create.mockResolvedValue({ id: 'u1', name: 'Alice', email: 'alice@test.com' });
      skillRepo.findOrCreate.mockResolvedValue(skill);
      userRepo.addSkill.mockResolvedValue(undefined);
      const userWithSkills = makeUser('u1', 'alice@test.com', []);
      userWithSkills.skills = [skill];
      userRepo.findByIdWithSkills.mockResolvedValue(userWithSkills);

      const result = await service.createUser({ name: 'Alice', email: 'alice@test.com', skills: ['typescript'] });

      expect(result.id).toBe('u1');
      expect(result.skills).toContain('typescript');
      expect(skillRepo.findOrCreate).toHaveBeenCalledTimes(1);
    });

    it('calls findOrCreate twice for two skills', async () => {
      const user = makeUser('u1', 'alice@test.com', ['s1', 's2']);

      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.create.mockResolvedValue({ id: 'u1' });
      skillRepo.findOrCreate
        .mockResolvedValueOnce(makeSkill('s1', 'typescript'))
        .mockResolvedValueOnce(makeSkill('s2', 'react'));
      userRepo.addSkill.mockResolvedValue(undefined);
      userRepo.findByIdWithSkills.mockResolvedValue(user);

      await service.createUser({ name: 'Alice', email: 'alice@test.com', skills: ['typescript', 'react'] });

      expect(skillRepo.findOrCreate).toHaveBeenCalledTimes(2);
    });

    it('throws ConflictException for duplicate email', async () => {
      userRepo.findByEmail.mockResolvedValue(makeUser('u1', 'alice@test.com', []));

      await expect(
        service.createUser({ name: 'Alice', email: 'alice@test.com', skills: ['typescript'] }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getMatches', () => {
    it('returns sorted matches with score', async () => {
      const target = makeUser('u1', 'alice@test.com', ['s1', 's2']);
      const other = makeUser('u2', 'bob@test.com', ['s1', 's3']);

      userRepo.findByIdWithSkills.mockResolvedValue(target);
      userRepo.findAllWithSkillsExcluding.mockResolvedValue([other]);
      matchingService.computeMatches.mockReturnValue([
        { user: other, skills: [makeSkill('s1', 'typescript')], score: 0.33 },
      ]);

      const result = await service.getMatches('u1');

      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(0.33);
    });

    it('returns empty array when no skill overlap', async () => {
      const target = makeUser('u1', 'alice@test.com', ['s1']);
      userRepo.findByIdWithSkills.mockResolvedValue(target);
      userRepo.findAllWithSkillsExcluding.mockResolvedValue([]);
      matchingService.computeMatches.mockReturnValue([]);

      const result = await service.getMatches('u1');

      expect(result).toEqual([]);
    });

    it('throws NotFoundException when user does not exist', async () => {
      userRepo.findByIdWithSkills.mockResolvedValue(null);

      await expect(service.getMatches('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
