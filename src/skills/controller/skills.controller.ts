import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SkillsService } from '../service/skills.service';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { ResponseSkillDto } from '../model/response-skill.dto';

// Manages the /skills endpoint.
// Only accessible with a valid API key — intended for admin/internal use.
@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  // @ApiSecurity('X-API-Key') shows the lock icon in Swagger UI for this endpoint.
  // @UseGuards(ApiKeyGuard) — checks the X-API-Key header for this route.
  // GET /skills — returns all skills with the number of users that have them.
  @ApiSecurity('X-API-Key')
  @ApiOperation({ summary: 'Return all skills with their user count (requires API key)' })
  @ApiResponse({ status: 200, type: [ResponseSkillDto] })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  @UseGuards(ApiKeyGuard)
  @Get()
  findAll() {
    return this.skillsService.findAll();
  }
}
