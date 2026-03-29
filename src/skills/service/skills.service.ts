import { Injectable } from '@nestjs/common';
import { SkillRepository } from '../infrastructure/skill.repository';
import { ResponseSkillDto } from '../model/response-skill.dto';

// De SkillsService bevat de businesslogica voor het ophalen van skills.
// Ze zet ruwe DB-rijen (met userCount als string) om naar een clean ResponseSkillDto.
@Injectable()
export class SkillsService {
  constructor(private readonly skillRepository: SkillRepository) {}

  async findAll(): Promise<ResponseSkillDto[]> {
    const rows = await this.skillRepository.findAllWithUserCount();
    // fromRaw() converteert de ruwe SQL-rij naar een DTO,
    // inclusief het parsen van userCount (string → number).
    return rows.map((row) => ResponseSkillDto.fromRaw(row));
  }
}
