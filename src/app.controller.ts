import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// Base controller — only present as a health check / entry point.
// Real functionality lives in UsersController and SkillsController.
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // GET / — returns a simple string to confirm the server is running.
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
