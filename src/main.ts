import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { e2eCorsOrigins } from './e2e/environment';
import { isAllowedFrontendOrigin } from './config/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'e2e'
        ? e2eCorsOrigins(process.env)
        : (
            origin: string | undefined,
            callback: (error: Error | null, allow: boolean) => void,
          ) => {
            callback(
              null,
              isAllowedFrontendOrigin(origin, process.env.FRONTEND_ORIGIN),
            );
          },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
