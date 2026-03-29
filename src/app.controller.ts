import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// Basis controller — enkel aanwezig als health-check / startpunt.
// Echte functionaliteit zit in UsersController en SkillsController.
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // GET / — geeft een simpele string terug om te bevestigen dat de server draait.
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
