import { ApiProperty } from '@nestjs/swagger';
import { User } from '../infrastructure/user.entity';
import { Skill } from '../../skills/infrastructure/skill.entity';

// The static fromEntity() factory method converts a raw DB entity into a clean response.
// This ensures internal DB details never leak to the outside.
export class ResponseUserDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Jan Janssen' })
  name: string;

  @ApiProperty({ example: 'jan@studaro.be' })
  email: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: ['typescript', 'react', 'nodejs'], type: [String] })
  skills: string[];

  static fromEntity(user: User, skills: Skill[]): ResponseUserDto {
    const dto = new ResponseUserDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.createdAt = user.createdAt;
    dto.skills = skills.map((s) => s.name);
    return dto;
  }
}
