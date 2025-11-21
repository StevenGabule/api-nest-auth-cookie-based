import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { createDocument } from './docs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);
  createDocument(app);
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => console.error(err));
