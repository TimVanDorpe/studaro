import { Module } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

//  De AuthModule registreert de guard als provider en exporteert hem, zodat andere modules (zoals
//   SkillsModule) de guard kunnen gebruiken zonder hem opnieuw te declareren.

@Module({
  providers: [ApiKeyGuard],
  exports: [ApiKeyGuard],
})
export class AuthModule {}
