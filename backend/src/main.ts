import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './adapter/http/configure-app';
import { setupSwagger } from './adapter/http/docs/swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
