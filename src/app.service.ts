import { Injectable } from '@nestjs/common';

// Basis service — enkel aanwezig als startpunt gegenereerd door de NestJS CLI.
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
