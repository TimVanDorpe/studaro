import { Injectable } from '@nestjs/common';
import { SkillRepository } from '../infrastructure/skill.repository';
import { ResponseSkillDto } from '../model/response-skill.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly skillRepository: SkillRepository) {}

  async findAll(): Promise<ResponseSkillDto[]> {
    const rows = await this.skillRepository.findAllWithUserCount();
    return rows.map((row) => ResponseSkillDto.fromRaw(row));
  }
}
