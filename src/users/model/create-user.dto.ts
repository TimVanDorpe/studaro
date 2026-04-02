import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// DTO for creating a user. The class-validator decorators are
// automatically executed by the global ValidationPipe in main.ts.
export class CreateUserDto {
  @ApiProperty({ example: 'Jan Janssen' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jan@studaro.be' })
  @IsEmail()
  email: string;

  // { each: true } makes class-validator validate each value in the array individually.
  // This ensures empty strings like "" are also rejected.
  @ApiProperty({ example: ['typescript', 'react', 'nodejs'], type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  skills: string[];
}
