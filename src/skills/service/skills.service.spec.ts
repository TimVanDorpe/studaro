import { Test, TestingModule } from '@nestjs/testing';
import { SkillsService } from './skills.service';
import { SkillRepository } from '../infrastructure/skill.repository';

//  De unit tests voor SkillsService. 
//  We mocken de repository met jest.fn() zodat er geen echte DB 
//   nodig is. We testen:
//   1. Dat rijen correct omgezet worden naar DTOs 
//      (en userCount een getal is, geen string)
//   2. Dat een lege array ook gewoon een lege array teruggeeft

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
