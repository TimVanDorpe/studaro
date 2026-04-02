import { Module } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

// The AuthModule registers the guard as a provider and exports it, so other modules (such as
// SkillsModule) can use the guard without declaring it again.

@Module({
  providers: [ApiKeyGuard],
  exports: [ApiKeyGuard],
})
export class AuthModule {}
