import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Sta requests toe van de Vite dev-server (poort 5173).
  // X-API-Key wordt doorgelaten zodat de ApiKeyGuard hem kan lezen.
  app.enableCors({
    origin: 'http://localhost:5173',
    allowedHeaders: ['Content-Type', 'X-API-Key'],
  });

  // Globale validatiepipe op basis van class-validator decorators in de DTOs.
  // - whitelist: verwijdert velden die niet in de DTO staan
  // - forbidNonWhitelisted: gooit een fout als er onbekende velden meegegeven worden
  // - transform: zet raw JSON automatisch om naar de juiste DTO class
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger UI beschikbaar op /api
  // addBearerAuth() voegt een veld toe in de UI om de X-API-Key in te geven
  // voor beveiligde endpoints (GET /skills).
  const config = new DocumentBuilder()
    .setTitle('Studaro API')
    .setDescription('Backend API voor skill-gebaseerde user matching')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-API-Key' }, 'X-API-Key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
