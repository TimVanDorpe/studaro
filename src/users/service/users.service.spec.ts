import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRepository } from '../infrastructure/user.repository';
import { SkillRepository } from '../../skills/infrastructure/skill.repository';
import { MatchingService } from './matching.service';
import { User } from '../infrastructure/user.entity';
import { Skill } from '../../skills/infrastructure/skill.entity';
import { UserSkill } from '../infrastructure/user-skill.entity';


//  De uitgebreidste test suite. We testen 6 scenario's zonder enige DB-verbinding — alles
//   gemockt met jest.fn(). Dit is de kracht van de gelaagde architectuur: je kan businesslogica
//   isoleren en snel testen.

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
  u.userSkills = skillIds.map((sid) => {
    const us = new UserSkill();
    us.skillId = sid;
    us.skill = makeSkill(sid, sid);
    return us;
  });
  return u;
}

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: Record<string, jest.Mock>;
  let skillRepo: Record<string, jest.Mock>;
  let matchingService: { computeMatches: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      createUserSkill: jest.fn(),
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
      userRepo.createUserSkill.mockResolvedValue(undefined);
      userRepo.findByIdWithSkills.mockResolvedValue(user);

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
      userRepo.createUserSkill.mockResolvedValue(undefined);
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
