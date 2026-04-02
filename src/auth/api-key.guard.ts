import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// Important: we use @UseGuards(ApiKeyGuard) (the class itself, not new ApiKeyGuard()), so that
// NestJS's DI system can inject ConfigService.
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
