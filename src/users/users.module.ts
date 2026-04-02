import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './infrastructure/user.entity';
import { UserRepository } from './infrastructure/user.repository';
import { UsersService } from './service/users.service';
import { UsersController } from './controller/users.controller';
import { MatchingService } from './service/matching.service';
import { SkillsModule } from '../skills/skills.module';

// UserSkill is no longer needed — the junction table 'user_skills' is
// automatically managed by TypeORM via the @ManyToMany/@JoinTable decorators on User.
@Module({
  imports: [TypeOrmModule.forFeature([User]), SkillsModule],
  controllers: [UsersController],
  providers: [UsersService, UserRepository, MatchingService],
})
export class UsersModule {}
