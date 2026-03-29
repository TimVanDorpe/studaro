import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SkillsService } from '../service/skills.service';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { ResponseSkillDto } from '../model/response-skill.dto';

// Beheert het /skills endpoint.
// Enkel toegankelijk met een geldige API key — bedoeld voor admin/intern gebruik.
@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  // @ApiSecurity('X-API-Key') toont het slotje in Swagger UI voor dit endpoint.
  // @UseGuards(ApiKeyGuard) — controleert de X-API-Key header voor deze route.
  // GET /skills — geeft alle skills terug met het aantal users dat ze heeft.
  @ApiSecurity('X-API-Key')
  @ApiOperation({ summary: 'Geef alle skills terug met hun aantal users (vereist API key)' })
  @ApiResponse({ status: 200, type: [ResponseSkillDto] })
  @ApiResponse({ status: 401, description: 'Ongeldige of ontbrekende API key' })
  @UseGuards(ApiKeyGuard)
  @Get()
  findAll() {
    return this.skillsService.findAll();
  }
}
