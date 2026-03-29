import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Skill } from './infrastructure/skill.entity';
import { SkillRepository } from './infrastructure/skill.repository';
import { SkillsService } from './service/skills.service';
import { SkillsController } from './controller/skills.controller';
import { AuthModule } from '../auth/auth.module';

// SkillRepository wordt geëxporteerd zodat UsersModule hem kan injecteren
// voor het aanmaken en opzoeken van skills bij het registreren van een user.
@Module({
  imports: [
    TypeOrmModule.forFeature([Skill]),
    AuthModule, // nodig voor ApiKeyGuard in SkillsController
  ],
  controllers: [SkillsController],
  providers: [SkillsService, SkillRepository],
  exports: [SkillRepository],
})
export class SkillsModule {}
