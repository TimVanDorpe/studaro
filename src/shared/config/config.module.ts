import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Wrapper module to make ConfigModule global across the application
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  exports: [ConfigModule],
})
export class AppConfigModule {}
