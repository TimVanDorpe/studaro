import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../service/users.service';
import { CreateUserDto } from '../model/create-user.dto';
import { ResponseUserDto } from '../model/response-user.dto';
import { ResponseMatchDto } from '../model/response-match.dto';

// Beheert twee endpoints onder het /users pad:
// - POST /users              → maak een nieuwe user aan met skills
// - GET  /users/:id/matches  → geef gesorteerde skill-matches terug voor een user
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Geef alle users terug met hun skills' })
  @ApiResponse({ status: 200, type: [ResponseUserDto] })
  @Get()
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  // De @Body() decorator haalt de request body op en valideert hem via CreateUserDto.
  @ApiOperation({ summary: 'Maak een nieuwe user aan met skills' })
  @ApiResponse({ status: 201, type: ResponseUserDto })
  @ApiResponse({ status: 400, description: 'Ongeldige invoer (validatie mislukt)' })
  @ApiResponse({ status: 409, description: 'Email is al in gebruik' })
  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  // @Param('id') haalt het :id segment uit de URL op als string.
  @ApiOperation({ summary: 'Geef skill-matches terug voor een user, gesorteerd op Jaccard-score' })
  @ApiParam({ name: 'id', description: 'UUID van de user' })
  @ApiResponse({ status: 200, type: [ResponseMatchDto] })
  @ApiResponse({ status: 404, description: 'User niet gevonden' })
  @Get(':id/matches')
  getMatches(@Param('id') id: string) {
    return this.usersService.getMatches(id);
  }
}
