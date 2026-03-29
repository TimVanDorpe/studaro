import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
  // Een Guard in NestJS beslist of een request mag doorgaan. Deze guard leest de X-API-Key header en
  // vergelijkt die met de waarde in .env.

  // Belangrijk: we gebruiken @UseGuards(ApiKeyGuard) (de klasse zelf, niet new ApiKeyGuard()), zodat
  // NestJS's DI-systeem ConfigService kan injecteren.
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];
    const expected = this.configService.get<string>('API_KEY');

    if (!apiKey || apiKey !== expected) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
