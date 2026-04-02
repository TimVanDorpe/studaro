import { ApiProperty } from '@nestjs/swagger';

export class ResponseSkillDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'typescript' })
  name: string;

  // Important detail: PostgreSQL's COUNT() function always returns a string,
  // even when the value is a number. That is why we use parseInt(row.userCount, 10)
  // — otherwise the API would return "userCount": "5" instead of "userCount": 5.
  @ApiProperty({ example: 42, description: 'Number of users that have this skill' })
  userCount: number;

  static fromRaw(row: { id: string; name: string; userCount: string }): ResponseSkillDto {
    const dto = new ResponseSkillDto();
    dto.id = row.id;
    dto.name = row.name;
    dto.userCount = parseInt(row.userCount, 10);
    return dto;
  }
}
