import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../service/users.service';
import { CreateUserDto } from '../model/create-user.dto';
import { ResponseUserDto } from '../model/response-user.dto';
import { ResponseMatchDto } from '../model/response-match.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Return all users with their skills' })
  @ApiResponse({ status: 200, type: [ResponseUserDto] })
  @Get()
  getAllUsers(): Promise<ResponseUserDto[]> {
    return this.usersService.getAllUsers();
  }

  @ApiOperation({ summary: 'Create a new user with skills' })
  @ApiResponse({ status: 201, type: ResponseUserDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (validation failed)',
  })
  @ApiResponse({ status: 409, description: 'Email is already in use' })
  @Post()
  createUser(@Body() dto: CreateUserDto): Promise<ResponseUserDto> {
    return this.usersService.createUser(dto);
  }

  @ApiOperation({
    summary: 'Return skill matches for a user, sorted by Jaccard score',
  })
  @ApiParam({ name: 'id', description: 'UUID of the user' })
  @ApiResponse({ status: 200, type: [ResponseMatchDto] })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id/matches')
  getMatches(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseMatchDto[]> {
    return this.usersService.getMatches(id);
  }
}
