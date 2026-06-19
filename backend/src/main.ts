import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './adapter/http/configure-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
