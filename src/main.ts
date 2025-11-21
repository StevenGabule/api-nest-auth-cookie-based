import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { createDocument } from './docs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  app.enableCors({
    origin: 'http://localhost:3000', // Next.js default port
    credentials: true, // Allow cookies to be sent
  });

  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);
  createDocument(app);
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 5000);
}

bootstrap().catch((err) => console.error(err));
