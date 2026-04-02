import { ApiProperty } from '@nestjs/swagger';
import { User } from '../infrastructure/user.entity';
import { Skill } from '../../skills/infrastructure/skill.entity';
import { ResponseUserDto } from './response-user.dto';

// DTO for a single match result: the matched user (as ResponseUserDto)
// and the Jaccard score (0.0 – 1.0) indicating how strong the skill overlap is.
export class ResponseMatchDto {
  @ApiProperty({ type: () => ResponseUserDto })
  user: ResponseUserDto;

  @ApiProperty({
    example: 0.67,
    description:
      'Jaccard score between 0.0 (no overlap) and 1.0 (identical skills)',
  })
  score: number;

  static from(user: User, skills: Skill[], score: number): ResponseMatchDto {
    const dto = new ResponseMatchDto();
    // Reuse ResponseUserDto.fromEntity() so DB internals never leak to the client.
    dto.user = ResponseUserDto.fromEntity(user, skills);
    dto.score = score;
    return dto;
  }
}
