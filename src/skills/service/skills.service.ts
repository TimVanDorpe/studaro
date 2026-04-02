import { Injectable } from '@nestjs/common';
import { SkillRepository } from '../infrastructure/skill.repository';
import { ResponseSkillDto } from '../model/response-skill.dto';

// SkillsService contains the business logic for fetching skills.
// It converts raw DB rows (with userCount as a string) into a clean ResponseSkillDto.
@Injectable()
export class SkillsService {
  constructor(private readonly skillRepository: SkillRepository) {}

  async findAll(): Promise<ResponseSkillDto[]> {
    const rows = await this.skillRepository.findAllWithUserCount();
    // fromRaw() converts the raw SQL row into a DTO,
    // including parsing userCount (string → number).
    return rows.map((row) => ResponseSkillDto.fromRaw(row));
  }
}
