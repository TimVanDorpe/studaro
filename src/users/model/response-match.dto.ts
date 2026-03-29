import { ApiProperty } from '@nestjs/swagger';
import { User } from '../infrastructure/user.entity';
import { Skill } from '../../skills/infrastructure/skill.entity';
import { ResponseUserDto } from './response-user.dto';

// DTO voor één match-resultaat: de gematchte user (als ResponseUserDto)
// en de Jaccard-score (0.0 – 1.0) die aangeeft hoe sterk de skill-overlap is.
export class ResponseMatchDto {
  @ApiProperty({ type: () => ResponseUserDto })
  user: ResponseUserDto;

  @ApiProperty({
    example: 0.67,
    description: 'Jaccard-score tussen 0.0 (geen overlap) en 1.0 (identieke skills)',
  })
  score: number;

  static from(user: User, skills: Skill[], score: number): ResponseMatchDto {
    const dto = new ResponseMatchDto();
    // Hergebruik ResponseUserDto.fromEntity() zodat DB-internals niet lekken naar de client.
    dto.user = ResponseUserDto.fromEntity(user, skills);
    dto.score = score;
    return dto;
  }
}
