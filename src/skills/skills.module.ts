import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Skill } from './infrastructure/skill.entity';
import { SkillRepository } from './infrastructure/skill.repository';
import { SkillsService } from './service/skills.service';
import { SkillsController } from './controller/skills.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Skill]),
    AuthModule, // required for ApiKeyGuard in SkillsController
  ],
  controllers: [SkillsController],
  providers: [SkillsService, SkillRepository],
  exports: [SkillRepository],
})
export class SkillsModule {}
