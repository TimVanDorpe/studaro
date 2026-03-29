import { ApiProperty } from '@nestjs/swagger';

export class ResponseSkillDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'typescript' })
  name: string;

  //  Belangrijk detail: PostgreSQL's COUNT() functie geeft altijd een string terug,
  // zelfs al is het een getal. Daarom gebruiken we parseInt(row.userCount, 10)
  // — anders zou de API "userCount": "5" teruggeven in plaats van "userCount": 5.
  @ApiProperty({ example: 42, description: 'Aantal users dat deze skill heeft' })
  userCount: number;

  static fromRaw(row: { id: string; name: string; userCount: string }): ResponseSkillDto {
    const dto = new ResponseSkillDto();
    dto.id = row.id;
    dto.name = row.name;
    dto.userCount = parseInt(row.userCount, 10);
    return dto;
  }
}
