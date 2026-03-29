import { ArrayNotEmpty, IsArray, IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// DTO voor het aanmaken van een user. De class-validator decorators worden
// automatisch uitgevoerd door de globale ValidationPipe in main.ts.
export class CreateUserDto {
  @ApiProperty({ example: 'Jan Janssen' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jan@studaro.be' })
  @IsEmail()
  email: string;

  // { each: true } laat class-validator elke waarde in de array individueel valideren.
  // Zo worden lege strings zoals "" ook geweigerd.
  @ApiProperty({ example: ['typescript', 'react', 'nodejs'], type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  skills: string[];
}
