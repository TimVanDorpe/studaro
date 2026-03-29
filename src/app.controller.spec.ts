import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Basis smoke-test voor de root controller — gegenereerd door de NestJS CLI.
// Controleert enkel of de GET / route 'Hello World!' teruggeeft.
describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    // Test.createTestingModule() bootstrapt een geïsoleerde NestJS module
    // zonder een echte database of HTTP server op te starten.
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
