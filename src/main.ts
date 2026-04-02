import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS_ORIGIN must be set in .env (e.g. http://localhost:5173 for the Vite dev server).
  // X-API-Key is passed through so the ApiKeyGuard can read it.
  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    allowedHeaders: ['Content-Type', 'X-API-Key'],
  });

  // Global validation pipe based on class-validator decorators in the DTOs.
  // - whitelist: removes fields not declared in the DTO
  // - forbidNonWhitelisted: throws an error if unknown fields are provided
  // - transform: automatically converts raw JSON to the correct DTO class
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger UI available at /api
  // addApiKey() adds a field in the UI to enter the X-API-Key
  // for secured endpoints (GET /skills).
  const config = new DocumentBuilder()
    .setTitle('Studaro API')
    .setDescription('Backend API for skill-based user matching')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-API-Key' }, 'X-API-Key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Application listening on port ${port}`, 'Bootstrap');
}
void bootstrap();
