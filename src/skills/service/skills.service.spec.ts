import { Test, TestingModule } from '@nestjs/testing';
import { SkillsService } from './skills.service';
import { SkillRepository } from '../infrastructure/skill.repository';

// Unit tests for SkillsService.
// We mock the repository with jest.fn() so no real DB is needed.
// We test:
//   1. That rows are correctly converted to DTOs
//      (and userCount is a number, not a string)
//   2. That an empty array also simply returns an empty array

describe('SkillsService', () => {
  let service: SkillsService;
  let skillRepository: { findAllWithUserCount: jest.Mock };

  beforeEach(async () => {
    skillRepository = { findAllWithUserCount: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        { provide: SkillRepository, useValue: skillRepository },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
  });

  describe('findAll', () => {
    it('maps rows to DTOs with userCount as number', async () => {
      skillRepository.findAllWithUserCount.mockResolvedValue([
        { id: 'uuid-1', name: 'typescript', userCount: '3' },
        { id: 'uuid-2', name: 'react', userCount: '1' },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('uuid-1');
      expect(result[0].name).toBe('typescript');
      expect(result[0].userCount).toBe(3);
      expect(typeof result[0].userCount).toBe('number');
    });

    it('returns empty array when no skills exist', async () => {
      skillRepository.findAllWithUserCount.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });
});
